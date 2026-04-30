import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Image, Pressable, ScrollView, Text, View,
  useWindowDimensions, type LayoutChangeEvent,
} from "react-native";

import {
  getTeamInitials,
  normalizeTeamDisplayName,
  resolveTeamVisualByName,
} from "@/lib/team-visuals";
import {
  getLatestFinishedRound,
  recomputeCampeonatoClassificacaoUntilRound,
} from "@/lib/tournament-results";
import type { Campeonato, TournamentFormat } from "@/types/tournament";

type LeagueProgressChartProps = {
  campeonato: Campeonato;
  format: TournamentFormat;
};

type MutableStanding = {
  participantId: string; teamName: string;
  points: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number;
};

type SeriesEntry = {
  participantId: string; teamName: string;
  pointsByRound: number[];
  currentPoints: number; goalDifference: number; wins: number;
  color: string; badgeUrl?: string; initials: string;
};

const SERIES_COLORS = [
  "#3B5BFF", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#14B8A6",
];

// ─── Layout constants ────────────────────────────────────────────────────────
// Landscape chart: X = points (left→right), Y = rounds (top→bottom)
// Chart expands DOWNWARD as rounds progress.
// Badge panel on the RIGHT shows all scored teams stacked vertically.

const PAD_TOP    = 28;   // space for X-axis (point) labels at top
const PAD_BOTTOM = 10;
const PAD_LEFT   = 38;   // space for Y-axis (round) labels on left
const PAD_RIGHT  = 12;
const BADGE_PANEL_W = 68;
const BADGE_SIZE    = 32;
const BADGE_SLOT_H  = BADGE_SIZE + 6;   // vertical slot per badge
const DOT_SIZE      = 8;
const GRID_LINE     = 0.6;
const SEG_W         = 2.5;
const SEG_GLOW_W    = 7;
const ROW_HEIGHT_PHONE  = 54;  // vertical px per round interval
const ROW_HEIGHT_TABLET = 68;

function SeriesBadge({
  badgeUrl, color, initials, size = BADGE_SIZE,
}: { badgeUrl?: string; color: string; initials: string; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      overflow: "hidden", alignItems: "center", justifyContent: "center",
      backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: color,
      shadowColor: color, shadowOpacity: 0.25, shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 }, elevation: 3,
    }}>
      {badgeUrl ? (
        <Image source={{ uri: badgeUrl }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
      ) : (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: `${color}22` }}>
          <Text style={{ color, fontSize: 9, fontWeight: "900" }}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

function getSeriesColor(i: number) {
  return i < SERIES_COLORS.length ? SERIES_COLORS[i]! : `hsl(${(i * 47) % 360},72%,52%)`;
}

function buildSeries(campeonato: Campeonato): SeriesEntry[] {
  const standings = new Map<string, MutableStanding>(
    campeonato.participantes.map((p) => [p.id, {
      participantId: p.id,
      teamName: normalizeTeamDisplayName(p.time || "Time"),
      points: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
    }]),
  );
  const byRound = new Map<string, number[]>();
  campeonato.participantes.forEach((p) => byRound.set(p.id, [0]));

  campeonato.rodadas.forEach((round) => {
    round.forEach((m) => {
      if (m.status !== "finalizado" || m.placarMandante == null || m.placarVisitante == null) return;
      const h = standings.get(m.mandanteId); const a = standings.get(m.visitanteId);
      if (!h || !a) return;
      const hg = m.placarMandante, ag = m.placarVisitante;
      h.goalsFor += hg; h.goalsAgainst += ag; h.goalDifference = h.goalsFor - h.goalsAgainst;
      a.goalsFor += ag; a.goalsAgainst += hg; a.goalDifference = a.goalsFor - a.goalsAgainst;
      if (hg > ag) { h.points += 3; h.wins++; a.losses++; }
      else if (ag > hg) { a.points += 3; a.wins++; h.losses++; }
      else { h.points++; a.points++; h.draws++; a.draws++; }
    });
    campeonato.participantes.forEach((p) => {
      const s = byRound.get(p.id) ?? [0];
      s.push(standings.get(p.id)?.points ?? s[s.length - 1] ?? 0);
      byRound.set(p.id, s);
    });
  });

  return campeonato.participantes
    .map((p, i) => {
      const tn = normalizeTeamDisplayName(p.time || "Time");
      const st = standings.get(p.id);
      return {
        participantId: p.id, teamName: tn,
        pointsByRound: byRound.get(p.id) ?? [0],
        currentPoints: st?.points ?? 0,
        goalDifference: st?.goalDifference ?? 0,
        wins: st?.wins ?? 0,
        color: getSeriesColor(i),
        badgeUrl: p.timeImagem ?? resolveTeamVisualByName(tn),
        initials: getTeamInitials(tn),
      } satisfies SeriesEntry;
    })
    .sort((a, b) => {
      if (b.currentPoints !== a.currentPoints) return b.currentPoints - a.currentPoints;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.teamName.localeCompare(b.teamName);
    });
}

// Landscape coordinates: X = points, Y = round index
function xCoord(pts: number, xMax: number, plotW: number) {
  return PAD_LEFT + (plotW * pts) / Math.max(xMax, 1);
}
function yCoord(roundIdx: number, numIntervals: number, plotH: number) {
  return PAD_TOP + (numIntervals <= 0 ? 0 : (plotH * roundIdx) / numIntervals);
}
function segStyle(x1: number, y1: number, x2: number, y2: number, col: string, w: number) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.max(Math.hypot(dx, dy), 2);
  return {
    position: "absolute" as const,
    left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - w / 2,
    width: len, height: w, borderRadius: 999, backgroundColor: col,
    transform: [{ rotateZ: `${Math.atan2(dy, dx)}rad` }],
  };
}

function getMovementMeta(d: number) {
  if (d > 0) return { symbol: "▲", label: `+${d} pos`, color: "#15803D", backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.20)" };
  if (d < 0) return { symbol: "▼", label: `${d} pos`, color: "#B91C1C", backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.20)" };
  return { symbol: "•", label: "estavel", color: "#64748B", backgroundColor: "rgba(148,163,184,0.12)", borderColor: "rgba(148,163,184,0.18)" };
}

export function LeagueProgressChart({ campeonato, format }: LeagueProgressChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isPhone = screenWidth < 768;

  const [containerWidth, setContainerWidth] = useState(Math.max(screenWidth - 48, 280));
  const [legendVisible, setLegendVisible] = useState(true);

  const series     = useMemo(() => buildSeries(campeonato), [campeonato]);
  const scored     = useMemo(
    () => series.filter((e) => e.currentPoints > 0),
    [series],
  );

  const latestRound   = useMemo(() => getLatestFinishedRound(campeonato), [campeonato]);
  const prevStandings = useMemo(
    () => latestRound > 1 ? recomputeCampeonatoClassificacaoUntilRound(campeonato, latestRound - 1) : [],
    [campeonato, latestRound],
  );
  const prevPosById = useMemo(
    () => new Map(prevStandings.map((e, i) => [e.participanteId, i + 1])),
    [prevStandings],
  );

  const totalRounds = Math.max(campeonato.rodadas.length, 0);
  const activeRounds = totalRounds > 0
    ? campeonato.rodadas.reduce((last, r, i) => r.some((m) => m.status === "finalizado") ? i + 1 : last, 0)
    : 0;
  const visiblePtCount = activeRounds + 1;   // includes round-0 baseline
  const numIntervals   = Math.max(visiblePtCount - 1, 1);

  // X-axis scale (points)
  const maxPts  = Math.max(0, ...series.flatMap((e) => e.pointsByRound.slice(0, visiblePtCount)));
  const tStep   = maxPts <= 4 ? 1 : Math.ceil(maxPts / 5);
  const tCount  = maxPts <= 4 ? Math.max(maxPts, 1) : 5;
  const xMax    = Math.max(tStep * tCount, 1);
  const xTicks  = Array.from({ length: Math.floor(xMax / tStep) + 1 }, (_, i) => i * tStep);

  // ── Chart height ────────────────────────────────────────────────────────────
  // Determined by whichever is taller: the round rows or the badge stack.
  const ROW_H       = isPhone ? ROW_HEIGHT_PHONE : ROW_HEIGHT_TABLET;
  const linesH      = numIntervals * ROW_H + PAD_TOP + PAD_BOTTOM;
  const badgeStackH = scored.length * BADGE_SLOT_H + PAD_TOP + PAD_BOTTOM;
  const chartHeight = Math.max(linesH, badgeStackH, isPhone ? 200 : 260);
  const plotH       = linesH - PAD_TOP - PAD_BOTTOM;   // round-grid uses linesH, not chartHeight

  // ── Canvas width — fills container, no horizontal scroll needed ─────────────
  const canvasW  = containerWidth - BADGE_PANEL_W;
  const plotW    = Math.max(canvasW - PAD_LEFT - PAD_RIGHT, 160);

  // ── Badge panel: scored teams stacked vertically top→bottom by ranking ──────
  const badgePanelEntries = useMemo(
    () => scored.map((entry, i) => ({ entry, y: PAD_TOP + i * BADGE_SLOT_H })),
    [scored],
  );

  const hasParticipants = campeonato.participantes.length > 0;
  const hasRounds       = totalRounds > 0;
  const canRender       = hasParticipants && hasRounds;

  function handleLayout(e: LayoutChangeEvent) {
    const w = Math.max(Math.round(e.nativeEvent.layout.width), 280);
    if (Math.abs(w - containerWidth) > 4) setContainerWidth(w);
  }

  if (format === "knockout") return null;

  return (
    <View style={{ gap: 4 }}>
      {/* ── Main chart container ── */}
      <View
        onLayout={handleLayout}
        style={{
          flexDirection: "row",
          height: chartHeight,
          borderRadius: 22,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(88,128,255,0.22)",
        }}
      >
        {/* ── Chart canvas (landscape: X=points, Y=rounds) ── */}
        <View style={{ flex: 1, backgroundColor: "#EDF4FF" }}>
          {canRender ? (
            <View style={{ width: canvasW, height: chartHeight }}>

              {/* X-axis: point-value labels at top + vertical grid lines */}
              {xTicks.map((pts) => {
                const x = xCoord(pts, xMax, plotW);
                return (
                  <View key={`xt-${pts}`}>
                    <View style={{
                      position: "absolute", left: x, top: PAD_TOP, bottom: PAD_BOTTOM,
                      width: GRID_LINE, backgroundColor: pts === 0
                        ? "rgba(59,91,255,0.18)" : "rgba(59,91,255,0.07)",
                    }} />
                    <Text style={{
                      position: "absolute", left: x - 12, top: 5,
                      width: 24, color: "#5E6E91", fontSize: 10, fontWeight: "800", textAlign: "center",
                    }}>
                      {pts}
                    </Text>
                  </View>
                );
              })}

              {/* Y-axis: round labels on left + horizontal grid lines */}
              {Array.from({ length: visiblePtCount }, (_, i) => i).map((ri) => {
                const y = yCoord(ri, numIntervals, plotH);
                return (
                  <View key={`yl-${ri}`}>
                    <View style={{
                      position: "absolute", left: PAD_LEFT, right: PAD_RIGHT,
                      top: y, height: GRID_LINE, backgroundColor: "rgba(59,91,255,0.10)",
                    }} />
                    <Text style={{
                      position: "absolute", left: 2, top: y - 8,
                      width: PAD_LEFT - 4, color: "#5E6E91",
                      fontSize: 10, fontWeight: "800", textAlign: "right",
                    }}>
                      {ri === 0 ? "R0" : `R${ri}`}
                    </Text>
                  </View>
                );
              })}

              {/* Series lines (only scored teams) */}
              {scored.map((entry) => {
                const pts = entry.pointsByRound.slice(0, visiblePtCount);
                return pts.slice(1).map((pv, idx) => {
                  const sx = xCoord(pts[idx] ?? 0, xMax, plotW);
                  const sy = yCoord(idx, numIntervals, plotH);
                  const ex = xCoord(pv, xMax, plotW);
                  const ey = yCoord(idx + 1, numIntervals, plotH);
                  return (
                    <View key={`${entry.participantId}-${idx}`}>
                      <View style={segStyle(sx, sy, ex, ey, `${entry.color}20`, SEG_GLOW_W)} />
                      <View style={segStyle(sx, sy, ex, ey, entry.color, SEG_W)} />
                    </View>
                  );
                });
              })}

              {/* Terminal dots at the end of each line (last active round) */}
              {activeRounds > 0 && scored.map((entry) => {
                const pts = entry.pointsByRound.slice(0, visiblePtCount);
                const fv  = pts.at(-1) ?? 0;
                const x   = xCoord(fv, xMax, plotW);
                const y   = yCoord(pts.length - 1, numIntervals, plotH);
                return (
                  <View key={`dot-${entry.participantId}`} style={{
                    position: "absolute",
                    left: x - DOT_SIZE / 2, top: y - DOT_SIZE / 2,
                    width: DOT_SIZE, height: DOT_SIZE,
                    borderRadius: DOT_SIZE / 2, backgroundColor: entry.color,
                    borderWidth: 2, borderColor: "#EDF4FF",
                  }} />
                );
              })}

              {activeRounds === 0 && (
                <View pointerEvents="none" style={{
                  position: "absolute", right: 14, top: 14,
                  borderRadius: 999, borderWidth: 1,
                  borderColor: "rgba(59,91,255,0.14)",
                  backgroundColor: "rgba(255,255,255,0.82)",
                  paddingHorizontal: 12, paddingVertical: 7,
                }}>
                  <Text style={{ color: "#3150A6", fontSize: 11, fontWeight: "800" }}>Inicio em 0 ponto</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24, backgroundColor: "#EDF4FF" }}>
              <Text style={{ color: "#1C2B4A", fontSize: 16, fontWeight: "900", textAlign: "center" }}>
                {!hasParticipants ? "Campeonato sem participantes" : "Rodadas ainda nao geradas"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Badge panel — all scored teams stacked VERTICALLY, 1st→last ── */}
        <View style={{
          width: BADGE_PANEL_W,
          height: chartHeight,
          backgroundColor: "rgba(215,228,255,0.82)",
          borderLeftWidth: 1,
          borderLeftColor: "rgba(88,128,255,0.20)",
          position: "relative",
        }}>
          {/* Column header */}
          <Text style={{
            position: "absolute", top: 6, left: 0, right: 0,
            textAlign: "center", color: "rgba(59,91,255,0.45)",
            fontSize: 8, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase",
          }}>
            Times
          </Text>

          {canRender && badgePanelEntries.map(({ entry, y }) => (
            <View key={`bp-${entry.participantId}`} style={{
              position: "absolute",
              left: (BADGE_PANEL_W - BADGE_SIZE) / 2,
              top: y,
            }}>
              <SeriesBadge badgeUrl={entry.badgeUrl} color={entry.color} initials={entry.initials} />
            </View>
          ))}

          {/* Idle state: show all teams stacked before any round */}
          {canRender && activeRounds === 0 && series.map((entry, i) => {
            const sp = Math.min((chartHeight - PAD_TOP - PAD_BOTTOM) / Math.max(series.length, 1), BADGE_SLOT_H);
            return (
              <View key={`idle-${entry.participantId}`} style={{
                position: "absolute",
                left: (BADGE_PANEL_W - BADGE_SIZE) / 2,
                top: PAD_TOP + i * sp,
              }}>
                <SeriesBadge badgeUrl={entry.badgeUrl} color={entry.color} initials={entry.initials} />
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Legend ── */}
      {canRender ? (
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => setLegendVisible((v) => !v)}
            style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2 }}
          >
            <Text style={{ color: "#5678C9", fontSize: 12, fontWeight: "700", letterSpacing: 1.2 }}>
              {legendVisible ? "Ocultar times" : "Mostrar times"}
            </Text>
            <Ionicons name={legendVisible ? "chevron-up" : "chevron-down"} size={14} color="#5678C9" />
          </Pressable>

          {legendVisible ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {series.map((entry) => {
                const pos     = series.findIndex((s) => s.participantId === entry.participantId) + 1;
                const prevPos = prevPosById.get(entry.participantId);
                const meta    = getMovementMeta(prevPos && prevPos > 0 ? prevPos - pos : 0);
                return (
                  <View key={`chip-${entry.participantId}`} style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    borderRadius: 999, borderWidth: 1, borderColor: `${entry.color}33`,
                    backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 8,
                  }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: entry.color }} />
                    <Text style={{ color: "#1C2B4A", fontSize: 12, fontWeight: "900" }}>{entry.teamName}</Text>
                    <Text style={{ color: "#6B7EA3", fontSize: 12, fontWeight: "600" }}>{entry.currentPoints} pts</Text>
                    <View style={{
                      borderRadius: 999, borderWidth: 1,
                      borderColor: meta.borderColor, backgroundColor: meta.backgroundColor,
                      paddingHorizontal: 8, paddingVertical: 4,
                    }}>
                      <Text style={{ color: meta.color, fontSize: 10, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" }}>
                        {meta.symbol} {meta.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
