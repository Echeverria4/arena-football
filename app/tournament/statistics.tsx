import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View, type LayoutChangeEvent } from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { calculateVictoryRate } from "@/lib/tournament-results";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

// ── types ─────────────────────────────────────────────────────────────────────

type ChartTab = "evolucao" | "ataque" | "radar";

type EvolucaoSeries = {
  participantId: string;
  name: string;
  teamName: string;
  color: string;
  crest?: string | null;
  pointsByRound: number[];
};

type RadarEntry = {
  participantId: string;
  name: string;
  teamName: string;
  color: string;
  values: number[];
};

type BarEntry = {
  participantId: string;
  name: string;
  teamName: string;
  value: number;
  color: string;
  crest?: string | null;
};

// ── constants ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#FFD76A", "#C4B5FD", "#67E8F9", "#86EFAC",
  "#F97316", "#EC4899", "#14B8A6", "#94A3B8",
];

const RADAR_LABELS = ["Ataque", "Defesa", "Aproveita.", "Consistência", "Saldo", "Vitórias"];
const RADAR_N = 6;

// ── helpers ───────────────────────────────────────────────────────────────────

function seg(
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  thickness: number,
  opacity = 1,
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.max(Math.hypot(dx, dy), 1);
  return {
    position: "absolute" as const,
    left: (x1 + x2) / 2 - len / 2,
    top: (y1 + y2) / 2 - thickness / 2,
    width: len,
    height: thickness,
    borderRadius: 999,
    backgroundColor: color,
    opacity,
    transform: [{ rotateZ: `${Math.atan2(dy, dx)}rad` }],
  };
}

function buildColorMap(bundle: NonNullable<ReturnType<typeof getTournamentBundle>>) {
  const map = new Map<string, string>();
  bundle.standings.forEach((s, i) => {
    map.set(s.participantId, CHART_COLORS[i % CHART_COLORS.length] ?? "#94A3B8");
  });
  return map;
}

function buildEvolucaoSeries(
  bundle: NonNullable<ReturnType<typeof getTournamentBundle>>,
  colorMap: Map<string, string>,
): EvolucaoSeries[] {
  const { campeonato, participants } = bundle;
  const pointsMap = new Map<string, number>(
    campeonato.participantes.map((p) => [p.id, 0]),
  );
  const byRound = new Map<string, number[]>(
    campeonato.participantes.map((p) => [p.id, [0]]),
  );

  (campeonato.rodadas ?? []).forEach((round) => {
    round.forEach((m) => {
      if (m.status !== "finalizado" || m.placarMandante == null || m.placarVisitante == null) return;
      const hg = m.placarMandante, ag = m.placarVisitante;
      const hp = pointsMap.get(m.mandanteId) ?? 0;
      const ap = pointsMap.get(m.visitanteId) ?? 0;
      if (hg > ag) pointsMap.set(m.mandanteId, hp + 3);
      else if (ag > hg) pointsMap.set(m.visitanteId, ap + 3);
      else { pointsMap.set(m.mandanteId, hp + 1); pointsMap.set(m.visitanteId, ap + 1); }
    });
    campeonato.participantes.forEach((p) => {
      const arr = byRound.get(p.id) ?? [0];
      arr.push(pointsMap.get(p.id) ?? arr[arr.length - 1] ?? 0);
      byRound.set(p.id, arr);
    });
  });

  return campeonato.participantes.map((p) => {
    const participant = participants.find((part) => part.id === p.id);
    const tn = normalizeTeamDisplayName((p as any).time ?? participant?.teamName ?? "Time");
    return {
      participantId: p.id,
      name: participant?.displayName ?? (p as any).nome ?? "Jogador",
      teamName: tn,
      color: colorMap.get(p.id) ?? "#94A3B8",
      crest: (p as any).timeImagem ?? participant?.teamBadgeUrl ?? resolveTeamVisualByName(tn),
      pointsByRound: byRound.get(p.id) ?? [0],
    };
  });
}

function buildRadarData(
  bundle: NonNullable<ReturnType<typeof getTournamentBundle>>,
  colorMap: Map<string, string>,
): RadarEntry[] {
  const { standings, participants } = bundle;
  const maxGoalsFor = Math.max(...standings.map((s) => s.goalsFor), 1);
  const maxGoalsAgainst = Math.max(...standings.map((s) => s.goalsAgainst), 1);
  const maxWins = Math.max(...standings.map((s) => s.wins), 1);
  const allDiffs = standings.map((s) => s.goalDifference);
  const minDiff = Math.min(...allDiffs, -1);
  const maxDiff = Math.max(...allDiffs, 1);

  return standings.map((s) => {
    const participant = participants.find((p) => p.id === s.participantId);
    const ataque = (s.goalsFor / maxGoalsFor) * 100;
    const defesa = ((maxGoalsAgainst - s.goalsAgainst) / maxGoalsAgainst) * 100;
    const aproveitamento = s.played > 0 ? (s.wins / s.played) * 100 : 0;
    const consistencia = s.played > 0 ? (s.points / (s.played * 3)) * 100 : 0;
    const saldoRange = maxDiff - minDiff;
    const saldo = saldoRange > 0 ? ((s.goalDifference - minDiff) / saldoRange) * 100 : 50;
    const vitorias = (s.wins / maxWins) * 100;
    const tn = normalizeTeamDisplayName(participant?.teamName ?? "Time");
    return {
      participantId: s.participantId,
      name: participant?.displayName ?? "Jogador",
      teamName: tn,
      color: colorMap.get(s.participantId) ?? "#94A3B8",
      values: [ataque, defesa, aproveitamento, consistencia, saldo, vitorias],
    };
  });
}

// ── Evolução Chart ────────────────────────────────────────────────────────────

const EVO_H = 220;
const EVO_PAD_T = 16, EVO_PAD_B = 34, EVO_PAD_L = 38;
const CREST_SZ = 22, CREST_GAP = 3;

function EvolucaoChart({
  series,
  containerWidth,
  selectedId,
}: {
  series: EvolucaoSeries[];
  containerWidth: number;
  selectedId: string | null;
}) {
  const numRounds = useMemo(
    () => Math.max(...series.map((s) => s.pointsByRound.length - 1), 0),
    [series],
  );
  const maxPts = useMemo(
    () => Math.max(...series.flatMap((s) => s.pointsByRound), 1),
    [series],
  );

  // Group series by final points so tied teams sit side by side
  const endGroups = useMemo(() => {
    const map = new Map<number, EvolucaoSeries[]>();
    series.forEach((s) => {
      const pts = s.pointsByRound[numRounds] ?? 0;
      const g = map.get(pts) ?? [];
      g.push(s);
      map.set(pts, g);
    });
    return map;
  }, [series, numRounds]);

  const maxGroupSize = useMemo(
    () => Math.max(...[...endGroups.values()].map((g) => g.length), 1),
    [endGroups],
  );

  const EVO_PAD_R = 6 + maxGroupSize * (CREST_SZ + CREST_GAP);
  const plotW = containerWidth - EVO_PAD_L - EVO_PAD_R;
  const plotH = EVO_H - EVO_PAD_T - EVO_PAD_B;

  if (containerWidth < 10) return null;

  function xPos(i: number) {
    return EVO_PAD_L + (numRounds <= 0 ? 0 : (i / numRounds) * plotW);
  }
  function yPos(v: number) {
    return EVO_PAD_T + (1 - v / maxPts) * plotH;
  }

  const gridVals = [0, Math.round(maxPts * 0.25), Math.round(maxPts * 0.5), Math.round(maxPts * 0.75), maxPts];

  if (numRounds === 0) {
    return (
      <View style={{ height: EVO_H, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#5B7FC4", fontSize: 12 }}>Nenhuma rodada disputada ainda.</Text>
      </View>
    );
  }

  return (
    <View style={{ width: containerWidth, height: EVO_H }}>
      {/* Grid Y lines + labels */}
      {gridVals.map((v) => (
        <View key={`gy-${v}`}>
          <View style={{
            position: "absolute",
            left: EVO_PAD_L, right: EVO_PAD_R,
            top: yPos(v), height: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
          }} />
          <Text style={{
            position: "absolute",
            left: 0, top: yPos(v) - 7,
            width: EVO_PAD_L - 4,
            textAlign: "right",
            fontSize: 9, fontWeight: "700", color: "#4A5568",
          }}>{v}</Text>
        </View>
      ))}

      {/* X round labels */}
      {Array.from({ length: numRounds }, (_, i) => i + 1).map((r) => (
        <Text key={`rx-${r}`} style={{
          position: "absolute",
          top: EVO_H - EVO_PAD_B + 7,
          left: xPos(r) - 12, width: 24,
          textAlign: "center",
          fontSize: 9, fontWeight: "700", color: "#4A5568",
        }}>R{r}</Text>
      ))}

      {/* Line segments per series */}
      {series.map((s) => {
        const active = !selectedId || selectedId === s.participantId;
        return s.pointsByRound.slice(1).map((pts, i) => {
          const x1 = xPos(i), y1 = yPos(s.pointsByRound[i] ?? 0);
          const x2 = xPos(i + 1), y2 = yPos(pts);
          return (
            <View key={`${s.participantId}-seg-${i}`} style={seg(x1, y1, x2, y2, s.color, 2.5, active ? 1 : 0.1)} />
          );
        });
      })}

      {/* Intermediate data points (skip index 0 and last) */}
      {series.map((s) => {
        const active = !selectedId || selectedId === s.participantId;
        return s.pointsByRound.map((pts, i) => {
          if (i === 0 || i === numRounds) return null;
          return (
            <View key={`${s.participantId}-dot-${i}`} style={{
              position: "absolute",
              left: xPos(i) - 3, top: yPos(pts) - 3,
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: "#060D18",
              borderWidth: 1.5, borderColor: s.color,
              opacity: active ? 1 : 0.1,
            }} />
          );
        });
      })}

      {/* Team crests at end of each line — tied teams placed side by side */}
      {series.map((s) => {
        const lastPts = s.pointsByRound[numRounds] ?? 0;
        const group = endGroups.get(lastPts) ?? [s];
        const idx = group.findIndex((g) => g.participantId === s.participantId);
        const xCrest = xPos(numRounds) + 5 + idx * (CREST_SZ + CREST_GAP);
        const yCrest = yPos(lastPts) - CREST_SZ / 2;
        const active = !selectedId || selectedId === s.participantId;

        if (s.crest) {
          return (
            <Image
              key={`crest-${s.participantId}`}
              source={{ uri: s.crest }}
              style={{
                position: "absolute",
                left: xCrest, top: yCrest,
                width: CREST_SZ, height: CREST_SZ,
                opacity: active ? 1 : 0.1,
              }}
              resizeMode="contain"
            />
          );
        }
        return (
          <View
            key={`crest-${s.participantId}`}
            style={{
              position: "absolute",
              left: xCrest, top: yCrest,
              width: CREST_SZ, height: CREST_SZ, borderRadius: CREST_SZ / 2,
              backgroundColor: `${s.color}22`,
              borderWidth: 1.5, borderColor: s.color,
              alignItems: "center", justifyContent: "center",
              opacity: active ? 1 : 0.1,
            }}
          >
            <Text style={{ fontSize: 7, fontWeight: "900", color: s.color }}>
              {s.teamName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Bar Ranking ───────────────────────────────────────────────────────────────

function BarRanking({
  title, subtitle, entries, unit,
}: {
  title: string;
  subtitle: string;
  entries: BarEntry[];
  unit: string;
}) {
  const maxVal = Math.max(...entries.map((e) => e.value), 1);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 3 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>{title}</Text>
        <Text style={{ fontSize: 11, color: "#6B7EA3" }}>{subtitle}</Text>
      </View>
      {entries.map((e, i) => (
        <View key={e.participantId} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11, flexShrink: 0,
            backgroundColor: i === 0 ? "rgba(255,215,106,0.12)" : "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: i === 0 ? "rgba(255,215,106,0.4)" : "rgba(255,255,255,0.1)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: i === 0 ? "#FFD76A" : "#6B7EA3" }}>{i + 1}</Text>
          </View>
          {e.crest ? (
            <Image source={{ uri: e.crest }} style={{ width: 24, height: 24, flexShrink: 0 }} resizeMode="contain" />
          ) : (
            <View style={{
              width: 24, height: 24, borderRadius: 12, flexShrink: 0,
              backgroundColor: `${e.color}22`, alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 8, fontWeight: "900", color: e.color }}>
                {e.teamName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ width: 72, flexShrink: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "800", color: "#F3F7FF" }}>{e.name}</Text>
            <Text numberOfLines={1} style={{ fontSize: 10, color: "#6B7EA3" }}>{e.teamName.split(" ")[0]}</Text>
          </View>
          <View style={{
            flex: 1, height: 8, borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden",
          }}>
            <View style={{
              height: "100%", borderRadius: 999,
              backgroundColor: e.color,
              width: `${(e.value / maxVal) * 100}%`,
              opacity: i === 0 ? 1 : 0.72,
            }} />
          </View>
          <Text style={{
            fontSize: 14, fontWeight: "900", color: e.color,
            flexShrink: 0, minWidth: 26, textAlign: "right",
          }}>{e.value}</Text>
          <Text style={{
            fontSize: 9, fontWeight: "700", color: "#6B7EA3",
            letterSpacing: 1, textTransform: "uppercase",
            flexShrink: 0, width: 28,
          }}>{unit}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Radar Chart ───────────────────────────────────────────────────────────────

function RadarChart({ entry, size }: { entry: RadarEntry; size: number }) {
  const CX = size / 2, CY = size / 2;
  const R = size * 0.33;
  const LABEL_R = R + 20;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  function polar(idx: number, radius: number) {
    const angle = (idx * (360 / RADAR_N) - 90) * (Math.PI / 180);
    return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  }

  const axisEnds = Array.from({ length: RADAR_N }, (_, i) => polar(i, R));
  const dataPoints = entry.values.map((v, i) => polar(i, (Math.max(v, 6) / 100) * R));
  const labelPos = Array.from({ length: RADAR_N }, (_, i) => polar(i, LABEL_R));

  return (
    <View style={{ width: size, height: size }}>
      {/* Grid polygon edges per level */}
      {levels.flatMap((lv) =>
        Array.from({ length: RADAR_N }, (_, i) => {
          const p1 = polar(i, R * lv);
          const p2 = polar((i + 1) % RADAR_N, R * lv);
          return <View key={`g-${lv}-${i}`} style={seg(p1.x, p1.y, p2.x, p2.y, "rgba(255,255,255,0.09)", 1)} />;
        })
      )}

      {/* Axis spokes */}
      {axisEnds.map((ep, i) => (
        <View key={`ax-${i}`} style={seg(CX, CY, ep.x, ep.y, "rgba(255,255,255,0.10)", 1)} />
      ))}

      {/* Player data polygon */}
      {dataPoints.map((dp, i) => {
        const next = dataPoints[(i + 1) % RADAR_N]!;
        return (
          <View key={`ds-${i}`} style={{
            ...seg(dp.x, dp.y, next.x, next.y, entry.color, 2.5),
            shadowColor: entry.color,
            shadowOpacity: 0.55,
            shadowRadius: 5,
          }} />
        );
      })}

      {/* Data dots */}
      {dataPoints.map((dp, i) => (
        <View key={`dd-${i}`} style={{
          position: "absolute",
          left: dp.x - 4, top: dp.y - 4,
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: entry.color,
          shadowColor: entry.color, shadowOpacity: 0.75, shadowRadius: 6,
        }} />
      ))}

      {/* Labels */}
      {labelPos.map((lp, i) => (
        <Text key={`ll-${i}`} style={{
          position: "absolute",
          left: lp.x - 28, top: lp.y - 9,
          width: 56, textAlign: "center",
          fontSize: 8, fontWeight: "800", color: "#7B9EC8",
        }}>{RADAR_LABELS[i]}</Text>
      ))}
    </View>
  );
}

// ── Chart Tab Bar ─────────────────────────────────────────────────────────────

const TABS: Array<{ id: ChartTab; label: string }> = [
  { id: "evolucao", label: "Evolução" },
  { id: "ataque",   label: "Ataque"   },
  { id: "radar",    label: "Radar"    },
];

function ChartTabBar({ active, onSelect }: { active: ChartTab; onSelect: (id: ChartTab) => void }) {
  return (
    <View style={{
      flexDirection: "row", gap: 6,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.03)",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
      padding: 5,
    }}>
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 12,
              backgroundColor: isActive ? "rgba(139,92,246,0.18)" : "transparent",
              borderWidth: 1,
              borderColor: isActive ? "rgba(139,92,246,0.30)" : "transparent",
              alignItems: "center",
            }}
          >
            <Text style={{
              fontSize: 11, fontWeight: "800",
              letterSpacing: 1.2, textTransform: "uppercase",
              color: isActive ? "#C4B5FD" : "#94A3B8",
            }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TournamentStatisticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const hydrated = useTournamentDataHydrated();
  const { contentMaxWidth } = usePanelGrid();

  const [activeTab, setActiveTab] = useState<ChartTab>("evolucao");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const bundle = hydrated && id ? getTournamentBundle(id, campeonatos, videos) : null;
  const activeTournamentAccessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const lockToActiveTournament = Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || !bundle || bundle.campeonato.id === currentTournamentId) return;
    router.replace({ pathname: "/tournament/statistics", params: { id: currentTournamentId } });
  }, [bundle?.campeonato.id, currentTournamentId, lockToActiveTournament]);

  const colorMap = useMemo(() => (bundle ? buildColorMap(bundle) : new Map()), [bundle]);

  const evolucaoSeries = useMemo(
    () => (bundle ? buildEvolucaoSeries(bundle, colorMap) : []),
    [bundle, colorMap],
  );

  const radarData = useMemo(
    () => (bundle ? buildRadarData(bundle, colorMap) : []),
    [bundle, colorMap],
  );

  // ── bar entries ──
  const attackEntries: BarEntry[] = useMemo(() => {
    if (!bundle) return [];
    return [...bundle.standings]
      .sort((a, b) => b.goalsFor - a.goalsFor)
      .slice(0, 5)
      .map((s) => {
        const p = bundle.participants.find((x) => x.id === s.participantId);
        const tn = normalizeTeamDisplayName(p?.teamName ?? "Time");
        return {
          participantId: s.participantId,
          name: p?.displayName ?? "Jogador",
          teamName: tn,
          value: s.goalsFor,
          color: colorMap.get(s.participantId) ?? "#94A3B8",
          crest: p?.teamBadgeUrl ?? resolveTeamVisualByName(tn),
        };
      });
  }, [bundle, colorMap]);

  const defenseEntries: BarEntry[] = useMemo(() => {
    if (!bundle) return [];
    return [...bundle.standings]
      .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
      .slice(0, 5)
      .map((s) => {
        const p = bundle.participants.find((x) => x.id === s.participantId);
        const tn = normalizeTeamDisplayName(p?.teamName ?? "Time");
        return {
          participantId: s.participantId,
          name: p?.displayName ?? "Jogador",
          teamName: tn,
          value: s.goalsAgainst,
          color: colorMap.get(s.participantId) ?? "#94A3B8",
          crest: p?.teamBadgeUrl ?? resolveTeamVisualByName(tn),
        };
      });
  }, [bundle, colorMap]);

  const winRateEntries: BarEntry[] = useMemo(() => {
    if (!bundle) return [];
    return [...bundle.standings]
      .sort((a, b) => {
        const diff = calculateVictoryRate(b.wins, b.played) - calculateVictoryRate(a.wins, a.played);
        return diff !== 0 ? diff : b.points - a.points;
      })
      .slice(0, 5)
      .map((s) => {
        const p = bundle.participants.find((x) => x.id === s.participantId);
        const tn = normalizeTeamDisplayName(p?.teamName ?? "Time");
        return {
          participantId: s.participantId,
          name: p?.displayName ?? "Jogador",
          teamName: tn,
          value: Math.round(calculateVictoryRate(s.wins, s.played)),
          color: colorMap.get(s.participantId) ?? "#94A3B8",
          crest: p?.teamBadgeUrl ?? resolveTeamVisualByName(tn),
        };
      });
  }, [bundle, colorMap]);

  // ── evolução insights ──
  const insights = useMemo(() => {
    if (evolucaoSeries.length === 0) return [];
    const leader = [...evolucaoSeries].sort(
      (a, b) => (b.pointsByRound.at(-1) ?? 0) - (a.pointsByRound.at(-1) ?? 0),
    )[0];
    const mostConsistent = [...evolucaoSeries].reduce((best, s) => {
      const stalled = s.pointsByRound.slice(1).filter((v, i) => v === (s.pointsByRound[i] ?? 0)).length;
      const bestStalled = best.pointsByRound.slice(1).filter((v, i) => v === (best.pointsByRound[i] ?? 0)).length;
      return stalled < bestStalled ? s : best;
    });
    return [
      {
        label: "Líder",
        value: leader?.name ?? "—",
        note: `${leader?.pointsByRound.at(-1) ?? 0} pts`,
        color: leader?.color ?? "#FFD76A",
      },
      {
        label: "Mais consistente",
        value: mostConsistent?.name ?? "—",
        note: "menos rodadas em branco",
        color: mostConsistent?.color ?? "#67E8F9",
      },
    ];
  }, [evolucaoSeries]);

  const radarSize = chartWidth > 0 ? Math.min(Math.floor((chartWidth - 28) * 0.38), 148) : 0;

  // ── states ──
  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", paddingVertical: 32 }}>
          <ScreenState title="Carregando gráficos" description="Sincronizando dados da temporada." />
        </View>
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", gap: 24, paddingVertical: 32 }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState title="Campeonato não encontrado" description="Este painel de gráficos não corresponde a um campeonato ativo." />
        </View>
      </Screen>
    );
  }

  if (bundle.standings.length === 0) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", gap: 24, paddingVertical: 32 }}>
          <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />
          <ScreenState
            title="Dados insuficientes"
            description="Cadastre participantes e dispute rodadas para visualizar os gráficos da temporada."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", gap: 24, paddingVertical: 32 }}>

        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <SectionHeader
          eyebrow="Estatísticas"
          title={bundle.tournament.name}
          subtitle="Evolução por rodada, ranking ofensivo e defensivo e perfil de desempenho por participante."
        />

        {/* Navigation chips */}
        <ScrollRow>
          <ChoiceChip label="Painel" onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } })} />
          <ChoiceChip label="Classificação" onPress={() => router.push({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })} />
          <ChoiceChip label="Estatísticas" active />
          <ChoiceChip label="Vídeos" onPress={() => router.push({ pathname: "/tournament/videos", params: { id: bundle.campeonato.id } })} />
        </ScrollRow>

        {/* Chart tab selector */}
        <ChartTabBar
          active={activeTab}
          onSelect={(t) => { setActiveTab(t); setSelectedSeriesId(null); }}
        />

        {/* ── Evolução ── */}
        {activeTab === "evolucao" && (
          <RevealOnScroll delay={0}>
            <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
              <View style={{ gap: 16, padding: 16 }}>
                <View style={{ gap: 3 }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>Evolução de pontos por rodada</Text>
                  <Text style={{ fontSize: 11, color: "#6B7EA3" }}>Pontuação acumulada · toque em um jogador para destacar</Text>
                </View>

                {/* Player filter chips */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {evolucaoSeries.map((s) => {
                    const isActive = selectedSeriesId === s.participantId;
                    return (
                      <Pressable
                        key={s.participantId}
                        onPress={() => setSelectedSeriesId(isActive ? null : s.participantId)}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 6,
                          paddingVertical: 5, paddingHorizontal: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: isActive ? `${s.color}88` : "rgba(255,255,255,0.10)",
                          backgroundColor: isActive ? `${s.color}18` : "rgba(255,255,255,0.03)",
                        }}
                      >
                        <View style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: s.color,
                          shadowColor: s.color, shadowOpacity: 0.7, shadowRadius: 4,
                        }} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? s.color : "#94A3B8" }}>
                          {s.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Chart canvas */}
                <View
                  onLayout={(e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width)}
                  style={{ width: "100%" }}
                >
                  <EvolucaoChart
                    series={evolucaoSeries}
                    containerWidth={chartWidth}
                    selectedId={selectedSeriesId}
                  />
                </View>

                {/* Insight cards */}
                {insights.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {insights.map((ins) => (
                      <View key={ins.label} style={{
                        flex: 1, minWidth: 120,
                        borderRadius: 14,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                        padding: 12, gap: 3,
                      }}>
                        <Text style={{ fontSize: 9, fontWeight: "900", letterSpacing: 1.6, textTransform: "uppercase", color: "#6B7EA3" }}>{ins.label}</Text>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: ins.color }}>{ins.value}</Text>
                        <Text style={{ fontSize: 10, color: "#94A3B8" }}>{ins.note}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </LiveBorderCard>
          </RevealOnScroll>
        )}

        {/* ── Ataque ── */}
        {activeTab === "ataque" && (
          <View style={{ gap: 14 }}>
            <RevealOnScroll delay={0}>
              <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
                <View style={{ padding: 20 }}>
                  <BarRanking
                    title="Ranking de ataque — gols marcados"
                    subtitle="Total de gols marcados na temporada"
                    entries={attackEntries}
                    unit="gols"
                  />
                </View>
              </LiveBorderCard>
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
                <View style={{ padding: 20 }}>
                  <BarRanking
                    title="Ranking defensivo — gols sofridos"
                    subtitle="Menos gols sofridos = melhor defesa"
                    entries={defenseEntries}
                    unit="sofr."
                  />
                </View>
              </LiveBorderCard>
            </RevealOnScroll>

            <RevealOnScroll delay={160}>
              <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
                <View style={{ padding: 20 }}>
                  <BarRanking
                    title="Aproveitamento — % de vitórias"
                    subtitle="Vitórias divididas pelo total de jogos"
                    entries={winRateEntries}
                    unit="%"
                  />
                </View>
              </LiveBorderCard>
            </RevealOnScroll>
          </View>
        )}

        {/* ── Radar ── */}
        {activeTab === "radar" && (
          <View
            onLayout={(e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width)}
            style={{ gap: 14 }}
          >
            {/* Group header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(139,92,246,0.18)" }} />
              <View style={{ alignItems: "center", gap: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: "900", letterSpacing: 2.5, textTransform: "uppercase", color: "#7B5CF0" }}>
                  GRUPO A
                </Text>
                <Text style={{ fontSize: 9, color: "#4A5568", letterSpacing: 0.5 }}>
                  {bundle.tournament.name}
                </Text>
              </View>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(139,92,246,0.18)" }} />
            </View>

            {/* One card per participant */}
            {radarData.map((entry, idx) => {
              const score = Math.round(entry.values.reduce((a, b) => a + b, 0) / RADAR_N);
              const rank = idx + 1;
              return (
                <RevealOnScroll key={entry.participantId} delay={idx * 55}>
                  <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
                    <View style={{ padding: 14, gap: 12 }}>

                      {/* Player header */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {/* Rank badge */}
                        <View style={{
                          width: 26, height: 26, borderRadius: 13, flexShrink: 0,
                          backgroundColor: rank === 1 ? "rgba(255,215,106,0.12)" : "rgba(255,255,255,0.05)",
                          borderWidth: 1,
                          borderColor: rank === 1 ? "rgba(255,215,106,0.4)" : "rgba(255,255,255,0.1)",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: "900", color: rank === 1 ? "#FFD76A" : "#6B7EA3" }}>
                            {rank}
                          </Text>
                        </View>
                        {/* Color dot */}
                        <View style={{
                          width: 9, height: 9, borderRadius: 5, flexShrink: 0,
                          backgroundColor: entry.color,
                          shadowColor: entry.color, shadowOpacity: 0.65, shadowRadius: 5,
                        }} />
                        {/* Name + team */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "900", color: "#F3F7FF" }}>
                            {entry.name}
                          </Text>
                          <Text style={{ fontSize: 10, color: "#6B7EA3" }}>
                            {entry.teamName}
                          </Text>
                        </View>
                        {/* Score badge */}
                        <View style={{
                          paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, flexShrink: 0,
                          backgroundColor: `${entry.color}18`,
                          borderWidth: 1, borderColor: `${entry.color}44`,
                        }}>
                          <Text style={{ fontSize: 17, fontWeight: "900", color: entry.color, lineHeight: 20 }}>
                            {score}
                          </Text>
                        </View>
                      </View>

                      {/* Radar + stat bars */}
                      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                        {radarSize > 0 && (
                          <View style={{ flexShrink: 0 }}>
                            <RadarChart entry={entry} size={radarSize} />
                          </View>
                        )}
                        <View style={{ flex: 1, gap: 7 }}>
                          {RADAR_LABELS.map((lbl, i) => {
                            const val = Math.round(entry.values[i] ?? 0);
                            return (
                              <View key={lbl} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                                <Text style={{ width: 66, fontSize: 9, fontWeight: "700", color: "#6B7EA3" }}>{lbl}</Text>
                                <View style={{
                                  flex: 1, height: 5, borderRadius: 999,
                                  backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden",
                                }}>
                                  <View style={{
                                    height: "100%", borderRadius: 999,
                                    backgroundColor: entry.color,
                                    width: `${val}%`, opacity: 0.88,
                                  }} />
                                </View>
                                <Text style={{
                                  width: 26, textAlign: "right",
                                  fontSize: 11, fontWeight: "900", color: entry.color,
                                }}>{val}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>

                    </View>
                  </LiveBorderCard>
                </RevealOnScroll>
              );
            })}
          </View>
        )}

      </View>
    </Screen>
  );
}
