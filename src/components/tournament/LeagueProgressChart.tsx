import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";

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
  participantId: string;
  teamName: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

type SeriesEntry = {
  participantId: string;
  teamName: string;
  pointsByRound: number[];
  currentPoints: number;
  goalDifference: number;
  wins: number;
  color: string;
  badgeUrl?: string;
  initials: string;
};

const SERIES_COLORS = [
  "#3B5BFF", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#14B8A6",
];

// X = rounds (horizontal), Y = points (vertical)
const AXIS_LABEL_WIDTH = 32;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = AXIS_LABEL_WIDTH + 14;
const BADGE_SIZE = 34;
const BADGE_GAP = 10;        // gap between last-round dot and badge column
const DOT_SIZE = 8;
// Right padding = space to draw badges after the last round point
const PADDING_RIGHT = BADGE_GAP + BADGE_SIZE + 14;
const BADGE_ROW_H = BADGE_SIZE + 4;   // vertical slot per badge in a group
const GROUP_GAP = 10;                  // extra vertical gap between score groups
const ROUND_LABEL_W = 22;
const GRID_LINE = 0.6;
const SEG_W = 2.5;
const SEG_GLOW_W = 7;

function SeriesBadge({
  badgeUrl, color, initials, size = BADGE_SIZE,
}: {
  badgeUrl?: string; color: string; initials: string; size?: number;
}) {
  return (
    <View style={{
      width: size, height: size,
      borderRadius: Math.round(size / 2),
      overflow: "hidden", alignItems: "center", justifyContent: "center",
      backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: color,
      shadowColor: color, shadowOpacity: 0.28, shadowRadius: 4,
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

function getSeriesColor(index: number) {
  if (index < SERIES_COLORS.length) return SERIES_COLORS[index];
  return `hsl(${(index * 47) % 360}, 72%, 52%)`;
}

function buildEmptyStandings(campeonato: Campeonato) {
  return campeonato.participantes.map((p) => ({
    participantId: p.id,
    teamName: normalizeTeamDisplayName(p.time || "Time"),
    points: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
  }));
}

function buildSeries(campeonato: Campeonato): SeriesEntry[] {
  const standings = new Map<string, MutableStanding>(
    buildEmptyStandings(campeonato).map((e) => [e.participantId, e]),
  );
  const pointsByRound = new Map<string, number[]>();
  campeonato.participantes.forEach((p) => pointsByRound.set(p.id, [0]));

  campeonato.rodadas.forEach((round) => {
    round.forEach((match) => {
      if (match.status !== "finalizado" || match.placarMandante == null || match.placarVisitante == null) return;
      const home = standings.get(match.mandanteId);
      const away = standings.get(match.visitanteId);
      if (!home || !away) return;
      const hg = match.placarMandante, ag = match.placarVisitante;
      home.goalsFor += hg; home.goalsAgainst += ag;
      away.goalsFor += ag; away.goalsAgainst += hg;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
      if (hg > ag) { home.points += 3; home.wins += 1; away.losses += 1; }
      else if (ag > hg) { away.points += 3; away.wins += 1; home.losses += 1; }
      else { home.points += 1; away.points += 1; home.draws += 1; away.draws += 1; }
    });
    campeonato.participantes.forEach((p) => {
      const s = pointsByRound.get(p.id) ?? [0];
      s.push(standings.get(p.id)?.points ?? s[s.length - 1] ?? 0);
      pointsByRound.set(p.id, s);
    });
  });

  return campeonato.participantes
    .map((p, index) => {
      const teamName = normalizeTeamDisplayName(p.time || "Time");
      const st = standings.get(p.id);
      return {
        participantId: p.id, teamName,
        pointsByRound: pointsByRound.get(p.id) ?? [0],
        currentPoints: st?.points ?? 0,
        goalDifference: st?.goalDifference ?? 0,
        wins: st?.wins ?? 0,
        color: getSeriesColor(index),
        badgeUrl: p.timeImagem ?? resolveTeamVisualByName(teamName),
        initials: getTeamInitials(teamName),
      } satisfies SeriesEntry;
    })
    .sort((a, b) => {
      if (b.currentPoints !== a.currentPoints) return b.currentPoints - a.currentPoints;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.teamName.localeCompare(b.teamName);
    });
}

function getYCoordinate(pts: number, yAxisMax: number, plotHeight: number): number {
  return PADDING_TOP + plotHeight - (plotHeight * pts) / Math.max(yAxisMax, 1);
}

function getPointCoords(
  roundIdx: number, pts: number,
  totalPts: number, yAxisMax: number,
  plotWidth: number, plotHeight: number,
) {
  const x = PADDING_LEFT + (totalPts <= 1 ? 0 : (plotWidth * roundIdx) / Math.max(totalPts - 1, 1));
  return { x, y: getYCoordinate(pts, yAxisMax, plotHeight) };
}

function segStyle(x1: number, y1: number, x2: number, y2: number, color: string, w: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.max(Math.hypot(dx, dy), 2);
  return {
    position: "absolute" as const,
    left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - w / 2,
    width: len, height: w, borderRadius: 999,
    backgroundColor: color, transform: [{ rotateZ: `${Math.atan2(dy, dx)}rad` }],
  };
}

function getMovementMeta(delta: number) {
  if (delta > 0) return { symbol: "▲", label: `+${delta} pos`, color: "#15803D", backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.20)" };
  if (delta < 0) return { symbol: "▼", label: `${delta} pos`, color: "#B91C1C", backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.20)" };
  return { symbol: "•", label: "estavel", color: "#64748B", backgroundColor: "rgba(148,163,184,0.12)", borderColor: "rgba(148,163,184,0.18)" };
}

export function LeagueProgressChart({ campeonato, format }: LeagueProgressChartProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isPhone = screenWidth < 768;

  const [containerWidth, setContainerWidth] = useState(Math.max(screenWidth - 48, 280));
  const [legendVisible, setLegendVisible] = useState(true);

  const series = useMemo(() => buildSeries(campeonato), [campeonato]);

  const latestFinishedRound = useMemo(() => getLatestFinishedRound(campeonato), [campeonato]);
  const previousRoundStandings = useMemo(
    () => latestFinishedRound > 1 ? recomputeCampeonatoClassificacaoUntilRound(campeonato, latestFinishedRound - 1) : [],
    [campeonato, latestFinishedRound],
  );
  const previousPositionById = useMemo(
    () => new Map(previousRoundStandings.map((e, i) => [e.participanteId, i + 1])),
    [previousRoundStandings],
  );

  const totalRounds = Math.max(campeonato.rodadas.length, 0);
  const activeRoundCount = totalRounds > 0
    ? campeonato.rodadas.reduce((last, round, idx) => round.some((m) => m.status === "finalizado") ? idx + 1 : last, 0)
    : 0;
  const visiblePointCount = activeRoundCount + 1;

  // Teams with at least 1 point (drawn on canvas + shown in badge area)
  const scoredSeries = useMemo(
    () => series.filter((e) => (e.pointsByRound.slice(0, visiblePointCount).at(-1) ?? 0) > 0),
    [series, visiblePointCount],
  );

  // Axis scale
  const maxPts = Math.max(0, ...series.flatMap((e) => e.pointsByRound.slice(0, visiblePointCount)));
  const tickStep = maxPts <= 4 ? 1 : Math.ceil(maxPts / 4);
  const tickCount = maxPts <= 4 ? Math.max(maxPts, 1) : 4;
  const yAxisMax = Math.max(tickStep * tickCount, 1);
  const yAxisValues = Array.from({ length: Math.floor(yAxisMax / tickStep) + 1 }, (_, i) => i * tickStep);

  // Group scored teams by their final score (desc)
  const scoreGroups = useMemo(() => {
    const map = new Map<number, SeriesEntry[]>();
    scoredSeries.forEach((entry) => {
      const pts = entry.pointsByRound.slice(0, visiblePointCount).at(-1) ?? 0;
      if (!map.has(pts)) map.set(pts, []);
      map.get(pts)!.push(entry);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([pts, entries]) => ({ pts, entries }));
  }, [scoredSeries, visiblePointCount]);

  // Auto-expand chart height to fit all badge rows
  const baseSingleH = isPhone
    ? Math.min(Math.round(screenHeight * 0.36), 300)
    : Math.min(Math.round(screenHeight * 0.40), 360);

  const minBadgeH = scoreGroups.reduce(
    (sum, g) => sum + g.entries.length * BADGE_ROW_H + GROUP_GAP,
    PADDING_TOP + PADDING_BOTTOM,
  );

  const chartHeight = Math.max(baseSingleH, minBadgeH);
  const plotHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;

  // Canvas dimensions
  const pointSpacing = isPhone ? 84 : 112;
  const chartCanvasWidth = Math.max(
    containerWidth,
    PADDING_LEFT + PADDING_RIGHT + Math.max(isPhone ? 240 : 360, Math.max(visiblePointCount - 1, 1) * pointSpacing),
  );
  const plotWidth = Math.max(chartCanvasWidth - PADDING_LEFT - PADDING_RIGHT, 200);

  // X of last round's dot
  const lastRoundX = useMemo(
    () => getPointCoords(visiblePointCount - 1, 0, visiblePointCount, yAxisMax, plotWidth, plotHeight).x,
    [visiblePointCount, yAxisMax, plotWidth, plotHeight],
  );
  const badgeLeft = lastRoundX + DOT_SIZE / 2 + BADGE_GAP;

  // Compute badge Y positions: each score group centred on its idealY, groups pushed
  // apart if they would collide.
  const badgePositions = useMemo(() => {
    if (!activeRoundCount || scoreGroups.length === 0) return [];

    // For each group, calculate the ideal top Y (centre the group around its score's Y)
    const items = scoreGroups.map(({ pts, entries }) => {
      const idealCentreY = getYCoordinate(pts, yAxisMax, plotHeight);
      const groupH = entries.length * BADGE_ROW_H - 4;  // actual height of the group
      return {
        pts,
        entries,
        groupH,
        idealTopY: idealCentreY - groupH / 2,
        topY: idealCentreY - groupH / 2,
      };
    });

    // Sweep down: if groups overlap, push the lower one down
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]!;
      const curr = items[i]!;
      const minTop = prev.topY + prev.groupH + GROUP_GAP;
      if (curr.topY < minTop) curr.topY = minTop;
    }

    // Clamp bottom + sweep up
    const maxTop = chartHeight - PADDING_BOTTOM;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]!;
      const bottom = item.topY + item.groupH;
      if (bottom > maxTop) item.topY = maxTop - item.groupH;
      if (i > 0) {
        const prev = items[i - 1]!;
        const minTop = item.topY - prev.groupH - GROUP_GAP;
        if (prev.topY > minTop) prev.topY = minTop;
      }
    }

    // Clamp top
    items.forEach((item) => { if (item.topY < PADDING_TOP) item.topY = PADDING_TOP; });

    // Flatten to per-badge positions
    return items.flatMap(({ entries, topY }) =>
      entries.map((entry, idx) => ({ entry, y: topY + idx * BADGE_ROW_H }))
    );
  }, [scoreGroups, plotHeight, yAxisMax, chartHeight, activeRoundCount]);

  const hasParticipants = campeonato.participantes.length > 0;
  const hasRounds = totalRounds > 0;
  const canRenderChart = hasParticipants && hasRounds;

  const emptyStateTitle = !hasParticipants ? "Campeonato sem participantes" : "Rodadas ainda nao geradas";
  const emptyStateDescription = !hasParticipants
    ? "Este campeonato foi salvo sem jogadores vinculados."
    : format === "groups" || format === "groups_knockout"
      ? "Fase de grupos sem rodadas finalizadas."
      : "Ainda nao ha confrontos finalizados.";

  function handleContainerLayout(event: LayoutChangeEvent) {
    const w = Math.max(Math.round(event.nativeEvent.layout.width), 280);
    if (Math.abs(w - containerWidth) > 4) setContainerWidth(w);
  }

  if (format === "knockout") return null;

  return (
    <View style={{ gap: 4 }}>
      <View
        onLayout={handleContainerLayout}
        style={{
          height: chartHeight,
          borderRadius: 22,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(88,128,255,0.22)",
        }}
      >
        {canRenderChart ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ minWidth: chartCanvasWidth }}
          >
            <View style={{ width: chartCanvasWidth, height: chartHeight, backgroundColor: "#EDF4FF" }}>

              {/* Y-axis: point labels + horizontal grid */}
              {yAxisValues.map((label) => {
                const y = getYCoordinate(label, yAxisMax, plotHeight);
                return (
                  <View key={`y-${label}`}>
                    <View style={{
                      position: "absolute", left: PADDING_LEFT, right: 0,
                      top: y, height: GRID_LINE,
                      backgroundColor: "rgba(59,91,255,0.10)",
                    }} />
                    <Text style={{
                      position: "absolute", left: 6, top: y - 8,
                      width: AXIS_LABEL_WIDTH, color: "#5E6E91",
                      fontSize: 11, fontWeight: "800", textAlign: "center",
                    }}>
                      {label}
                    </Text>
                  </View>
                );
              })}

              {/* X-axis: vertical guides + round labels */}
              {Array.from({ length: visiblePointCount }, (_, i) => i).map((ri) => {
                const { x } = getPointCoords(ri, 0, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                return (
                  <View key={`x-${ri}`}>
                    <View style={{
                      position: "absolute", left: x, top: PADDING_TOP,
                      bottom: PADDING_BOTTOM, width: GRID_LINE,
                      backgroundColor: "rgba(59,91,255,0.06)",
                    }} />
                    <Text style={{
                      position: "absolute", left: x - ROUND_LABEL_W / 2, bottom: 6,
                      width: ROUND_LABEL_W,
                      color: "#5E6E91", fontSize: 11, fontWeight: "700", textAlign: "center",
                    }}>
                      {ri}
                    </Text>
                  </View>
                );
              })}

              {/* Lines — only scored teams */}
              {scoredSeries.map((entry) => {
                const pts = entry.pointsByRound.slice(0, visiblePointCount);
                return pts.slice(1).map((pv, idx) => {
                  const s = getPointCoords(idx, pts[idx] ?? 0, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                  const e = getPointCoords(idx + 1, pv, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                  return (
                    <View key={`${entry.participantId}-${idx}`}>
                      <View style={segStyle(s.x, s.y, e.x, e.y, `${entry.color}20`, SEG_GLOW_W)} />
                      <View style={segStyle(s.x, s.y, e.x, e.y, entry.color, SEG_W)} />
                    </View>
                  );
                });
              })}

              {/* Terminal dots at end of each line */}
              {activeRoundCount > 0 && scoredSeries.map((entry) => {
                const pts = entry.pointsByRound.slice(0, visiblePointCount);
                const fv = pts.at(-1) ?? 0;
                const { x, y } = getPointCoords(pts.length - 1, fv, visiblePointCount, yAxisMax, plotWidth, plotHeight);
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

              {/* Thin separator before badge column */}
              {activeRoundCount > 0 && (
                <View style={{
                  position: "absolute",
                  left: badgeLeft - BADGE_GAP / 2,
                  top: PADDING_TOP, bottom: PADDING_BOTTOM,
                  width: 1,
                  backgroundColor: "rgba(88,128,255,0.15)",
                }} />
              )}

              {/* ── ALL scored team badges at end of their line ── */}
              {badgePositions.map(({ entry, y }) => (
                <View key={`badge-${entry.participantId}`} style={{
                  position: "absolute",
                  left: badgeLeft,
                  top: y,
                }}>
                  <SeriesBadge
                    badgeUrl={entry.badgeUrl}
                    color={entry.color}
                    initials={entry.initials}
                    size={BADGE_SIZE}
                  />
                </View>
              ))}

              {activeRoundCount === 0 && (
                <View pointerEvents="none" style={{
                  position: "absolute", right: PADDING_RIGHT + 8, top: 14,
                  borderRadius: 999, borderWidth: 1,
                  borderColor: "rgba(59,91,255,0.14)",
                  backgroundColor: "rgba(255,255,255,0.82)",
                  paddingHorizontal: 12, paddingVertical: 7,
                }}>
                  <Text style={{ color: "#3150A6", fontSize: 11, fontWeight: "800" }}>Inicio em 0 ponto</Text>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={{
            flex: 1, alignItems: "center", justifyContent: "center",
            gap: 12, paddingHorizontal: 24, backgroundColor: "#EDF4FF",
          }}>
            <Text style={{ color: "#1C2B4A", fontSize: 16, fontWeight: "900", textAlign: "center" }}>{emptyStateTitle}</Text>
            <Text style={{ color: "#6B7EA3", fontSize: 13, lineHeight: 22, textAlign: "center" }}>{emptyStateDescription}</Text>
          </View>
        )}
      </View>

      {/* ── Legend ── */}
      {canRenderChart ? (
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
                const pos = series.findIndex((s) => s.participantId === entry.participantId) + 1;
                const prevPos = previousPositionById.get(entry.participantId);
                const meta = getMovementMeta(prevPos && prevPos > 0 ? prevPos - pos : 0);
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
