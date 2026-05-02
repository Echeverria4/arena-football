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

type RoundResult = "W" | "D" | "L";

type EvolucaoSeries = {
  participantId: string;
  name: string;
  teamName: string;
  color: string;
  crest?: string | null;
  pointsByRound: number[];
  resultsByRound: Array<RoundResult | null>; // index 0 = result that produced pointsByRound[1]
};

type RadarEntry = {
  participantId: string;
  name: string;
  teamName: string;
  color: string;
  groupName: string;
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

type HomeAwayEntry = {
  participantId: string;
  name: string;
  teamName: string;
  color: string;
  crest?: string | null;
  homeGoals: number;
  awayGoals: number;
  homeWins: number;
  awayWins: number;
  homeGames: number;
  awayGames: number;
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
  const resultsByRoundMap = new Map<string, Array<RoundResult | null>>(
    campeonato.participantes.map((p) => [p.id, []]),
  );

  (campeonato.rodadas ?? []).forEach((round) => {
    const finalizedMatches = round.filter(
      (m) => m.status === "finalizado" && m.placarMandante != null && m.placarVisitante != null,
    );
    if (finalizedMatches.length === 0) return;

    const playedThisRound = new Set<string>();
    const roundResultFor = new Map<string, RoundResult>();

    finalizedMatches.forEach((m) => {
      const hg = m.placarMandante!, ag = m.placarVisitante!;
      const hp = pointsMap.get(m.mandanteId) ?? 0;
      const ap = pointsMap.get(m.visitanteId) ?? 0;
      playedThisRound.add(m.mandanteId);
      playedThisRound.add(m.visitanteId);
      if (hg > ag) {
        pointsMap.set(m.mandanteId, hp + 3);
        roundResultFor.set(m.mandanteId, "W");
        roundResultFor.set(m.visitanteId, "L");
      } else if (ag > hg) {
        pointsMap.set(m.visitanteId, ap + 3);
        roundResultFor.set(m.visitanteId, "W");
        roundResultFor.set(m.mandanteId, "L");
      } else {
        pointsMap.set(m.mandanteId, hp + 1);
        pointsMap.set(m.visitanteId, ap + 1);
        roundResultFor.set(m.mandanteId, "D");
        roundResultFor.set(m.visitanteId, "D");
      }
    });

    // Only add data point for participants who actually played this round
    campeonato.participantes.forEach((p) => {
      if (!playedThisRound.has(p.id)) return;
      const arr = byRound.get(p.id) ?? [0];
      arr.push(pointsMap.get(p.id) ?? arr[arr.length - 1] ?? 0);
      byRound.set(p.id, arr);
      const results = resultsByRoundMap.get(p.id) ?? [];
      results.push(roundResultFor.get(p.id) ?? null);
      resultsByRoundMap.set(p.id, results);
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
      resultsByRound: resultsByRoundMap.get(p.id) ?? [],
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
      groupName: participant?.groupName ?? "Geral",
      values: [ataque, defesa, aproveitamento, consistencia, saldo, vitorias],
    };
  });
}

// ── Evolução Chart ────────────────────────────────────────────────────────────
// Orientation: X = rounds (left→right), Y = cumulative points (bottom→top)
// Crests placed side-by-side horizontally at the right end of each line.

const EVO_H = 220;
const EVO_PAD_T = 16;
const EVO_PAD_B = 34;
const EVO_PAD_L = 38;
const CREST_SZ = 22;
const CREST_GAP = 3;

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

  const endGroups = useMemo(() => {
    const map = new Map<string, EvolucaoSeries[]>();
    series.forEach((s) => {
      const lastRound = s.pointsByRound.length - 1;
      const pts = s.pointsByRound[lastRound] ?? 0;
      const key = `${lastRound}:${pts}`;
      const g = map.get(key) ?? [];
      g.push(s);
      map.set(key, g);
    });
    return map;
  }, [series]);

  const maxGroupSize = useMemo(
    () => Math.max(...[...endGroups.values()].map((g) => g.length), 1),
    [endGroups],
  );

  const EVO_PAD_R = 6 + maxGroupSize * (CREST_SZ + CREST_GAP);
  const plotW = containerWidth - EVO_PAD_L - EVO_PAD_R;
  const plotH = EVO_H - EVO_PAD_T - EVO_PAD_B;

  if (containerWidth < 10) return null;

  function xPos(roundIdx: number) {
    return EVO_PAD_L + (numRounds <= 0 ? 0 : (roundIdx / numRounds) * plotW);
  }
  function yPos(pts: number) {
    return EVO_PAD_T + (1 - (maxPts <= 0 ? 0 : pts / maxPts)) * plotH;
  }

  // Y-axis grid at multiples of 3 (point values)
  const yGridPts: number[] = [];
  for (let p = 0; p <= maxPts; p += 3) yGridPts.push(p);
  if (yGridPts[yGridPts.length - 1] !== maxPts) yGridPts.push(maxPts);

  if (numRounds === 0) {
    return (
      <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#5B7FC4", fontSize: 12 }}>Nenhuma rodada disputada ainda.</Text>
      </View>
    );
  }

  return (
    <View style={{ width: containerWidth, height: EVO_H }}>

      {/* Y-axis: horizontal grid lines + point labels at left */}
      {yGridPts.map((pts) => (
        <View key={`hg-${pts}`}>
          <View style={{
            position: "absolute",
            left: EVO_PAD_L, right: EVO_PAD_R,
            top: yPos(pts), height: 0.6,
            backgroundColor: pts === 0 ? "rgba(59,91,255,0.30)" : "rgba(59,91,255,0.12)",
          }} />
          <Text style={{
            position: "absolute",
            left: 2, top: yPos(pts) - 8,
            width: EVO_PAD_L - 6, textAlign: "right",
            fontSize: 10, fontWeight: "800", color: "#4A6490",
          }}>{pts}</Text>
        </View>
      ))}

      {/* X-axis: vertical grid lines + round labels at bottom */}
      {Array.from({ length: numRounds + 1 }, (_, r) => r).map((r) => (
        <View key={`vg-${r}`}>
          <View style={{
            position: "absolute",
            left: xPos(r), top: EVO_PAD_T,
            width: 0.6, height: plotH,
            backgroundColor: r === 0 ? "rgba(59,91,255,0.30)" : "rgba(59,91,255,0.12)",
          }} />
          <Text style={{
            position: "absolute",
            left: xPos(r) - 10, top: EVO_PAD_T + plotH + 6,
            width: 20, textAlign: "center",
            fontSize: 10, fontWeight: "800", color: "#4A6490",
          }}>R{r}</Text>
        </View>
      ))}

      {/* Glow behind each line segment — only up to last played round */}
      {series.map((s) => {
        const active = !selectedId || selectedId === s.participantId;
        const lastRound = s.pointsByRound.length - 1;
        return s.pointsByRound.slice(0, lastRound).map((pts, i) => {
          const nextPts = s.pointsByRound[i + 1]!;
          return (
            <View
              key={`${s.participantId}-glow-${i}`}
              style={seg(xPos(i), yPos(pts), xPos(i + 1), yPos(nextPts), s.color, 8, active ? 0.13 : 0.02)}
            />
          );
        });
      })}

      {/* Main line segments — only up to last played round */}
      {series.map((s) => {
        const active = !selectedId || selectedId === s.participantId;
        const lastRound = s.pointsByRound.length - 1;
        return s.pointsByRound.slice(0, lastRound).map((pts, i) => {
          const nextPts = s.pointsByRound[i + 1]!;
          return (
            <View
              key={`${s.participantId}-line-${i}`}
              style={seg(xPos(i), yPos(pts), xPos(i + 1), yPos(nextPts), s.color, 2.5, active ? 1 : 0.08)}
            />
          );
        });
      })}

      {/* Junction dots — colored by round result (green=W, yellow=D, red=L) */}
      {series.map((s) => {
        const active = !selectedId || selectedId === s.participantId;
        const lastRound = s.pointsByRound.length - 1;
        return s.pointsByRound.map((pts, i) => {
          if (i === 0) return null;
          const result = s.resultsByRound[i - 1] ?? null;
          const dotColor = result === "W" ? "#22C55E" : result === "D" ? "#EAB308" : result === "L" ? "#EF4444" : s.color;
          const r = 4;
          return (
            <View key={`${s.participantId}-dot-${i}`} style={{
              position: "absolute",
              left: xPos(i) - r, top: yPos(pts) - r,
              width: r * 2, height: r * 2, borderRadius: r,
              backgroundColor: dotColor,
              opacity: active ? 1 : 0.08,
            }} />
          );
        });
      })}

      {/* Crests at each series' own last position */}
      {series.map((s) => {
        const lastRound = s.pointsByRound.length - 1;
        const finalPts = s.pointsByRound[lastRound] ?? 0;
        const key = `${lastRound}:${finalPts}`;
        const group = endGroups.get(key) ?? [s];
        const idx = group.findIndex((g) => g.participantId === s.participantId);
        const xCrest = xPos(lastRound) + 5 + idx * (CREST_SZ + CREST_GAP);
        const yCrest = yPos(finalPts) - CREST_SZ / 2;
        const active = !selectedId || selectedId === s.participantId;
        return (
          <View
            key={`crest-${s.participantId}`}
            style={{
              position: "absolute",
              left: xCrest, top: yCrest,
              width: CREST_SZ, height: CREST_SZ,
              borderRadius: CREST_SZ / 2,
              overflow: "hidden",
              backgroundColor: "#060D18",
              borderWidth: 1.5, borderColor: s.color,
              alignItems: "center", justifyContent: "center",
              opacity: active ? 1 : 0.1,
              shadowColor: s.color, shadowOpacity: 0.55, shadowRadius: 6,
            }}
          >
            {s.crest ? (
              <Image
                source={{ uri: s.crest }}
                style={{ width: CREST_SZ - 4, height: CREST_SZ - 4 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontSize: 8, fontWeight: "900", color: s.color }}>
                {s.teamName.slice(0, 2).toUpperCase()}
              </Text>
            )}
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

// ── Home / Away Card ─────────────────────────────────────────────────────────

function HomeAwayCard({ entries }: { entries: HomeAwayEntry[] }) {
  const maxRate = 100;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 3 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>Casa vs Fora</Text>
        <Text style={{ fontSize: 11, color: "#6B7EA3" }}>Aproveitamento em casa e fora — % de vitórias</Text>
      </View>

      {/* Column headers */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }} />
        <View style={{ width: 78, alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", color: "#3B82F6" }}>Casa</Text>
        </View>
        <View style={{ width: 78, alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", color: "#A78BFA" }}>Fora</Text>
        </View>
      </View>

      {entries.map((e, i) => (
        <View key={e.participantId} style={{ gap: 6 }}>
          {/* Name row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10, flexShrink: 0,
              backgroundColor: i === 0 ? "rgba(255,215,106,0.12)" : "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: i === 0 ? "rgba(255,215,106,0.4)" : "rgba(255,255,255,0.1)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 9, fontWeight: "900", color: i === 0 ? "#FFD76A" : "#6B7EA3" }}>{i + 1}</Text>
            </View>
            {e.crest ? (
              <Image source={{ uri: e.crest }} style={{ width: 20, height: 20, flexShrink: 0 }} resizeMode="contain" />
            ) : (
              <View style={{ width: 20, height: 20, borderRadius: 10, flexShrink: 0, backgroundColor: `${e.color}22`, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 7, fontWeight: "900", color: e.color }}>{e.teamName.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "800", color: "#F3F7FF" }}>{e.name}</Text>
            </View>
            {/* Casa % vitórias */}
            <View style={{ width: 78, alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#3B82F6" }}>
                {e.homeGames > 0 ? Math.round((e.homeWins / e.homeGames) * 100) : 0}%
              </Text>
              <Text style={{ fontSize: 9, color: "#6B7EA3" }}>casa</Text>
            </View>
            {/* Fora % vitórias */}
            <View style={{ width: 78, alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#A78BFA" }}>
                {e.awayGames > 0 ? Math.round((e.awayWins / e.awayGames) * 100) : 0}%
              </Text>
              <Text style={{ fontSize: 9, color: "#6B7EA3" }}>fora</Text>
            </View>
          </View>
          {/* Dual bar */}
          <View style={{ flexDirection: "row", gap: 4, paddingLeft: 28 }}>
            <View style={{ flex: 1, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <View style={{ height: "100%", borderRadius: 999, backgroundColor: "#3B82F6", width: `${e.homeGames > 0 ? (e.homeWins / e.homeGames) * maxRate : 0}%`, opacity: 0.85 }} />
            </View>
            <View style={{ flex: 1, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <View style={{ height: "100%", borderRadius: 999, backgroundColor: "#A78BFA", width: `${e.awayGames > 0 ? (e.awayWins / e.awayGames) * maxRate : 0}%`, opacity: 0.85 }} />
            </View>
          </View>
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

  const homeAwayEntries: HomeAwayEntry[] = useMemo(() => {
    if (!bundle) return [];
    const map = new Map<string, HomeAwayEntry>();
    bundle.participants.forEach((p) => {
      const tn = normalizeTeamDisplayName(p.teamName ?? "Time");
      map.set(p.id, {
        participantId: p.id,
        name: p.displayName ?? "Jogador",
        teamName: tn,
        color: colorMap.get(p.id) ?? "#94A3B8",
        crest: p.teamBadgeUrl ?? resolveTeamVisualByName(tn),
        homeGoals: 0, awayGoals: 0,
        homeWins: 0, awayWins: 0,
        homeGames: 0, awayGames: 0,
      });
    });
    bundle.campeonato.rodadas.flat().forEach((m) => {
      if (m.status !== "finalizado" || m.placarMandante == null || m.placarVisitante == null) return;
      const hg = m.placarMandante, ag = m.placarVisitante;
      const home = map.get(m.mandanteId);
      const away = map.get(m.visitanteId);
      if (home) { home.homeGoals += hg; home.homeGames += 1; if (hg > ag) home.homeWins += 1; }
      if (away) { away.awayGoals += ag; away.awayGames += 1; if (ag > hg) away.awayWins += 1; }
    });
    return [...map.values()].sort(
      (a, b) => (b.homeGoals + b.awayGoals) - (a.homeGoals + a.awayGoals),
    );
  }, [bundle, colorMap]);

  // ── evolução insights ──
  const insights = useMemo(() => {
    if (evolucaoSeries.length === 0 || !bundle) return [];
    const leader = [...evolucaoSeries].sort(
      (a, b) => (b.pointsByRound.at(-1) ?? 0) - (a.pointsByRound.at(-1) ?? 0),
    )[0];
    const topScorer = [...bundle.standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
    const topScorerParticipant = bundle.participants.find((p) => p.id === topScorer?.participantId);
    return [
      {
        label: "Líder",
        value: leader?.name ?? "—",
        note: `${leader?.pointsByRound.at(-1) ?? 0} pts`,
        color: leader?.color ?? "#FFD76A",
      },
      {
        label: "Mais letal",
        value: topScorerParticipant?.displayName ?? "—",
        note: `${topScorer?.goalsFor ?? 0} gols marcados`,
        color: colorMap.get(topScorer?.participantId ?? "") ?? "#86EFAC",
      },
    ];
  }, [evolucaoSeries, bundle, colorMap]);

  const radarDataByGroup = useMemo(() => {
    const map = new Map<string, RadarEntry[]>();
    radarData.forEach((entry) => {
      const g = entry.groupName;
      const arr = map.get(g) ?? [];
      arr.push(entry);
      map.set(g, arr);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, entries]) => ({
        groupName,
        entries: [...entries].sort(
          (a, b) => b.values.reduce((x, y) => x + y, 0) - a.values.reduce((x, y) => x + y, 0),
        ),
      }));
  }, [radarData]);
  const showRadarGroupHeaders = radarDataByGroup.length > 1 || (radarDataByGroup[0]?.groupName !== "Geral");

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
          <ChoiceChip label="Músicas" onPress={() => router.push({ pathname: "/tournament/musicas", params: { id: bundle.campeonato.id } })} />
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

            <RevealOnScroll delay={240}>
              <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
                <View style={{ padding: 20 }}>
                  <HomeAwayCard entries={homeAwayEntries} />
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
            {radarDataByGroup.map(({ groupName, entries }) => (
              <View key={groupName} style={{ gap: 10 }}>
                {/* One card per participant — sorted by composite score within group */}
                {entries.map((entry, idx) => {
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
            ))}
          </View>
        )}

      </View>
    </Screen>
  );
}
