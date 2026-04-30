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
  "#3B5BFF",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#84CC16",
  "#EC4899",
  "#14B8A6",
];

const AXIS_LABEL_WIDTH = 34;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = AXIS_LABEL_WIDTH + 20;
const PADDING_RIGHT = 16;
const BADGE_PANEL_WIDTH = 68;
const BADGE_SIZE = 36;
const DOT_SIZE = 9;
const X_AXIS_LABEL_WIDTH = 24;
const GRID_LINE_THICKNESS = 0.6;
const SEGMENT_THICKNESS = 2.5;
const SEGMENT_GLOW_THICKNESS = 6;

function SeriesBadge({
  badgeUrl,
  color,
  initials,
  size = BADGE_SIZE,
}: {
  badgeUrl?: string;
  color: string;
  initials: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 2),
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: color,
      }}
    >
      {badgeUrl ? (
        <Image
          source={{ uri: badgeUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${color}22`,
          }}
        >
          <Text style={{ color, fontSize: 9, fontWeight: "900" }}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

function getSeriesColor(index: number) {
  if (index < SERIES_COLORS.length) {
    return SERIES_COLORS[index];
  }
  const hue = (index * 47) % 360;
  return `hsl(${hue}, 72%, 52%)`;
}

function buildEmptyStandings(campeonato: Campeonato) {
  return campeonato.participantes.map((participant) => ({
    participantId: participant.id,
    teamName: normalizeTeamDisplayName(participant.time || "Time"),
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  }));
}

function sortStandings(list: MutableStanding[]) {
  return [...list].sort((current, next) => {
    if (next.points !== current.points) return next.points - current.points;
    if (next.goalDifference !== current.goalDifference) return next.goalDifference - current.goalDifference;
    if (next.goalsFor !== current.goalsFor) return next.goalsFor - current.goalsFor;
    if (next.wins !== current.wins) return next.wins - current.wins;
    return current.teamName.localeCompare(next.teamName);
  });
}

function buildSeries(campeonato: Campeonato) {
  const standings = new Map<string, MutableStanding>(
    buildEmptyStandings(campeonato).map((entry) => [entry.participantId, entry]),
  );
  const pointsByRound = new Map<string, number[]>();

  campeonato.participantes.forEach((participant) => {
    pointsByRound.set(participant.id, [0]);
  });

  campeonato.rodadas.forEach((round) => {
    round.forEach((match) => {
      if (
        match.status !== "finalizado" ||
        match.placarMandante == null ||
        match.placarVisitante == null
      ) return;

      const home = standings.get(match.mandanteId);
      const away = standings.get(match.visitanteId);
      if (!home || !away) return;

      const homeGoals = match.placarMandante;
      const awayGoals = match.placarVisitante;

      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (homeGoals > awayGoals) {
        home.points += 3;
        home.wins += 1;
        away.losses += 1;
      } else if (awayGoals > homeGoals) {
        away.points += 3;
        away.wins += 1;
        home.losses += 1;
      } else {
        home.points += 1;
        away.points += 1;
        home.draws += 1;
        away.draws += 1;
      }
    });

    campeonato.participantes.forEach((participant) => {
      const currentSeries = pointsByRound.get(participant.id) ?? [0];
      currentSeries.push(
        standings.get(participant.id)?.points ?? currentSeries[currentSeries.length - 1] ?? 0,
      );
      pointsByRound.set(participant.id, currentSeries);
    });
  });

  return campeonato.participantes
    .map((participant, index) => {
      const teamName = normalizeTeamDisplayName(participant.time || "Time");
      const currentStanding = standings.get(participant.id);
      return {
        participantId: participant.id,
        teamName,
        pointsByRound: pointsByRound.get(participant.id) ?? [0],
        currentPoints: currentStanding?.points ?? 0,
        goalDifference: currentStanding?.goalDifference ?? 0,
        wins: currentStanding?.wins ?? 0,
        color: getSeriesColor(index),
        badgeUrl: participant.timeImagem ?? resolveTeamVisualByName(teamName),
        initials: getTeamInitials(teamName),
      } satisfies SeriesEntry;
    })
    .sort((current, next) => {
      if (next.currentPoints !== current.currentPoints) return next.currentPoints - current.currentPoints;
      if (next.goalDifference !== current.goalDifference) return next.goalDifference - current.goalDifference;
      if (next.wins !== current.wins) return next.wins - current.wins;
      return current.teamName.localeCompare(next.teamName);
    });
}

function getYCoordinate(
  pointValue: number,
  yAxisMax: number,
  plotHeight: number,
): number {
  return PADDING_TOP + plotHeight - (plotHeight * pointValue) / Math.max(yAxisMax, 1);
}

function getPointCoordinates(
  pointIndex: number,
  pointValue: number,
  totalPoints: number,
  yAxisMax: number,
  plotWidth: number,
  plotHeight: number,
) {
  const horizontalDivisor = Math.max(totalPoints - 1, 1);
  const x =
    PADDING_LEFT + (totalPoints <= 1 ? 0 : (plotWidth * pointIndex) / horizontalDivisor);
  const y = getYCoordinate(pointValue, yAxisMax, plotHeight);
  return { x, y };
}

function getSegmentStyle(x1: number, y1: number, x2: number, y2: number, color: string) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(Math.hypot(dx, dy), 2);
  const angle = Math.atan2(dy, dx);
  return {
    position: "absolute" as const,
    left: (x1 + x2) / 2 - length / 2,
    top: (y1 + y2) / 2 - SEGMENT_THICKNESS / 2,
    width: length,
    height: SEGMENT_THICKNESS,
    borderRadius: 999,
    backgroundColor: color,
    transform: [{ rotateZ: `${angle}rad` }],
  };
}

function getSegmentGlowStyle(x1: number, y1: number, x2: number, y2: number, color: string) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(Math.hypot(dx, dy), 2);
  const angle = Math.atan2(dy, dx);
  return {
    position: "absolute" as const,
    left: (x1 + x2) / 2 - length / 2,
    top: (y1 + y2) / 2 - SEGMENT_GLOW_THICKNESS / 2,
    width: length,
    height: SEGMENT_GLOW_THICKNESS,
    borderRadius: 999,
    backgroundColor: `${color}22`,
    transform: [{ rotateZ: `${angle}rad` }],
  };
}

function getMovementMeta(positionDelta: number) {
  if (positionDelta > 0) {
    return {
      symbol: "▲",
      label: `+${positionDelta} pos`,
      color: "#15803D",
      backgroundColor: "rgba(34,197,94,0.12)",
      borderColor: "rgba(34,197,94,0.20)",
    };
  }
  if (positionDelta < 0) {
    return {
      symbol: "▼",
      label: `${positionDelta} pos`,
      color: "#B91C1C",
      backgroundColor: "rgba(239,68,68,0.12)",
      borderColor: "rgba(239,68,68,0.20)",
    };
  }
  return {
    symbol: "•",
    label: "estavel",
    color: "#64748B",
    backgroundColor: "rgba(148,163,184,0.12)",
    borderColor: "rgba(148,163,184,0.18)",
  };
}

export function LeagueProgressChart({
  campeonato,
  format,
}: LeagueProgressChartProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isPhone = screenWidth < 768;

  const [containerWidth, setContainerWidth] = useState(Math.max(screenWidth - 48, 280));
  const [legendVisible, setLegendVisible] = useState(true);

  // Chart height fills a good portion of the screen — larger on tall phones
  const chartHeight = isPhone
    ? Math.min(Math.round(screenHeight * 0.46), 420)
    : Math.min(Math.round(screenHeight * 0.52), 580);

  const series = useMemo(() => buildSeries(campeonato), [campeonato]);
  const visibleSeries = useMemo(
    () => series.filter((entry) => entry.currentPoints > 0),
    [series],
  );
  const latestFinishedRound = useMemo(
    () => getLatestFinishedRound(campeonato),
    [campeonato],
  );
  const previousRoundStandings = useMemo(
    () =>
      latestFinishedRound > 1
        ? recomputeCampeonatoClassificacaoUntilRound(campeonato, latestFinishedRound - 1)
        : [],
    [campeonato, latestFinishedRound],
  );
  const previousPositionByParticipantId = useMemo(
    () => new Map(previousRoundStandings.map((entry, index) => [entry.participanteId, index + 1])),
    [previousRoundStandings],
  );

  const totalRounds = Math.max(campeonato.rodadas.length, 0);
  const activeRoundCount =
    totalRounds > 0
      ? campeonato.rodadas.reduce(
          (last, round, idx) =>
            round.some((m) => m.status === "finalizado") ? idx + 1 : last,
          0,
        )
      : 0;
  const visiblePointCount = activeRoundCount + 1;
  const maxVisiblePoints = Math.max(
    0,
    ...series.flatMap((entry) => entry.pointsByRound.slice(0, visiblePointCount)),
  );
  const tickStep = maxVisiblePoints <= 4 ? 1 : Math.ceil(maxVisiblePoints / 4);
  const tickCount = maxVisiblePoints <= 4 ? Math.max(maxVisiblePoints, 1) : 4;
  const yAxisMax = Math.max(tickStep * tickCount, 1);
  const yAxisValues = Array.from(
    { length: Math.floor(yAxisMax / tickStep) + 1 },
    (_, index) => index * tickStep,
  );

  // Chart canvas: width minus the badge panel on the right
  const chartPanelWidth = containerWidth - BADGE_PANEL_WIDTH;
  const pointSpacing = isPhone ? 68 : 96;
  const chartCanvasWidth = Math.max(
    chartPanelWidth,
    PADDING_LEFT + PADDING_RIGHT + Math.max(isPhone ? 260 : 400, Math.max(visiblePointCount - 1, 1) * pointSpacing),
  );
  const plotWidth = Math.max(chartCanvasWidth - PADDING_LEFT - PADDING_RIGHT, 240);
  const plotHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;

  // Badge panel: position each crest at the Y corresponding to its final points,
  // with a sweep-down + clamp-up pass to prevent overlaps.
  const badgePanelEntries = useMemo(() => {
    if (!activeRoundCount || visibleSeries.length === 0) return [];

    const MIN_SPACING = BADGE_SIZE + 3;
    const maxY = chartHeight - PADDING_BOTTOM - BADGE_SIZE / 2;
    const minY = PADDING_TOP + BADGE_SIZE / 2;

    const items = visibleSeries.map((entry) => {
      const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);
      const finalValue = visiblePoints[visiblePoints.length - 1] ?? 0;
      const idealY = getYCoordinate(finalValue, yAxisMax, plotHeight);
      return { entry, idealY, y: idealY };
    });

    // Sort ascending by Y (top of chart = smallest Y = highest points)
    items.sort((a, b) => a.idealY - b.idealY);

    // Sweep down: push overlapping badges downward
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]!;
      const curr = items[i]!;
      if (curr.y - prev.y < MIN_SPACING) {
        curr.y = prev.y + MIN_SPACING;
      }
    }

    // Sweep up from bottom: clamp to maxY and pull previous ones up
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]!;
      if (item.y > maxY) item.y = maxY;
      if (i > 0) {
        const prev = items[i - 1]!;
        if (item.y - prev.y < MIN_SPACING) {
          prev.y = item.y - MIN_SPACING;
        }
      }
    }

    // Clamp top
    items.forEach((item) => { item.y = Math.max(item.y, minY); });

    return items;
  }, [visibleSeries, visiblePointCount, plotHeight, yAxisMax, chartHeight, activeRoundCount]);

  const hasParticipants = campeonato.participantes.length > 0;
  const hasRounds = totalRounds > 0;
  const canRenderLeagueChart = hasParticipants && hasRounds;
  const xAxisLabels = Array.from({ length: visiblePointCount }, (_, index) => index);
  const emptyStateTitle = !hasParticipants ? "Campeonato sem participantes" : "Rodadas ainda nao geradas";
  const emptyStateDescription = !hasParticipants
    ? "Este campeonato foi salvo sem jogadores vinculados."
    : format === "groups" || format === "groups_knockout"
      ? "Fase de grupos sem rodadas finalizadas para montar a curva de evolucao."
      : "O campeonato esta em pontos corridos, mas ainda nao ha confrontos finalizados.";

  function handleContainerLayout(event: LayoutChangeEvent) {
    const w = Math.max(Math.round(event.nativeEvent.layout.width), 280);
    if (Math.abs(w - containerWidth) > 4) setContainerWidth(w);
  }

  if (format === "knockout") return null;

  return (
    <View style={{ gap: 4 }}>
      {/* ── Main chart + badge panel row ── */}
      <View
        onLayout={handleContainerLayout}
        style={{
          flexDirection: "row",
          height: chartHeight,
          borderRadius: 22,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(88,128,255,0.22)",
        }}
      >
        {/* ── Scrollable chart area ── */}
        <View style={{ flex: 1, backgroundColor: "#EDF4FF" }}>
          {canRenderLeagueChart ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ minWidth: chartCanvasWidth }}
            >
              <View style={{ width: chartCanvasWidth, height: chartHeight }}>
                {/* Y-axis grid lines + labels */}
                {yAxisValues.map((label) => {
                  const y = getYCoordinate(label, yAxisMax, plotHeight);
                  return (
                    <View key={`grid-y-${label}`}>
                      <View
                        style={{
                          position: "absolute",
                          left: PADDING_LEFT,
                          right: PADDING_RIGHT,
                          top: y,
                          height: GRID_LINE_THICKNESS,
                          backgroundColor: "rgba(59,91,255,0.10)",
                        }}
                      />
                      <Text
                        style={{
                          position: "absolute",
                          left: 8,
                          top: y - 8,
                          width: AXIS_LABEL_WIDTH,
                          color: "#5E6E91",
                          fontSize: 11,
                          fontWeight: "800",
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}

                {/* X-axis grid lines */}
                {xAxisLabels.map((label, index) => {
                  const { x } = getPointCoordinates(index, 0, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                  return (
                    <View
                      key={`grid-x-${label}`}
                      style={{
                        position: "absolute",
                        left: x,
                        top: PADDING_TOP,
                        bottom: PADDING_BOTTOM,
                        width: GRID_LINE_THICKNESS,
                        backgroundColor: "rgba(59,91,255,0.06)",
                      }}
                    />
                  );
                })}

                {/* Series line segments */}
                {visibleSeries.map((entry) => {
                  const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);
                  return visiblePoints.slice(1).map((pointValue, index) => {
                    const start = getPointCoordinates(index, visiblePoints[index] ?? 0, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                    const end = getPointCoordinates(index + 1, pointValue, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                    return (
                      <View key={`${entry.participantId}-seg-${index}`}>
                        <View style={getSegmentGlowStyle(start.x, start.y, end.x, end.y, entry.color)} />
                        <View style={getSegmentStyle(start.x, start.y, end.x, end.y, entry.color)} />
                      </View>
                    );
                  });
                })}

                {/* Terminal dots at the last visible point (no badge here — badges are in the panel) */}
                {activeRoundCount > 0 && visibleSeries.map((entry) => {
                  const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);
                  const finalValue = visiblePoints[visiblePoints.length - 1] ?? 0;
                  const { x, y } = getPointCoordinates(
                    Math.max(visiblePoints.length - 1, 0),
                    finalValue,
                    visiblePointCount,
                    yAxisMax,
                    plotWidth,
                    plotHeight,
                  );
                  return (
                    <View
                      key={`${entry.participantId}-dot`}
                      style={{
                        position: "absolute",
                        left: x - DOT_SIZE / 2,
                        top: y - DOT_SIZE / 2,
                        width: DOT_SIZE,
                        height: DOT_SIZE,
                        borderRadius: DOT_SIZE / 2,
                        backgroundColor: entry.color,
                        borderWidth: 2,
                        borderColor: "#EDF4FF",
                      }}
                    />
                  );
                })}

                {/* X-axis round labels */}
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", left: 0, right: 0, bottom: 8, height: 18 }}
                >
                  {xAxisLabels.map((label, index) => {
                    const { x } = getPointCoordinates(index, 0, visiblePointCount, yAxisMax, plotWidth, plotHeight);
                    return (
                      <Text
                        key={`round-label-${label}`}
                        style={{
                          position: "absolute",
                          left: x - X_AXIS_LABEL_WIDTH / 2,
                          color: "#5E6E91",
                          fontSize: 11,
                          fontWeight: "700",
                          width: X_AXIS_LABEL_WIDTH,
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </Text>
                    );
                  })}
                </View>

                {activeRoundCount === 0 ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      right: 16,
                      top: 16,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "rgba(59,91,255,0.14)",
                      backgroundColor: "rgba(255,255,255,0.82)",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "#3150A6", fontSize: 11, fontWeight: "800" }}>
                      Inicio em 0 ponto
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          ) : (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24, backgroundColor: "rgba(255,255,255,0.36)" }}
            >
              <Text style={{ color: "#1C2B4A", fontSize: 16, fontWeight: "900", textAlign: "center" }}>
                {emptyStateTitle}
              </Text>
              <Text style={{ color: "#6B7EA3", fontSize: 13, lineHeight: 22, textAlign: "center" }}>
                {emptyStateDescription}
              </Text>
            </View>
          )}
        </View>

        {/* ── Badge panel (right sidebar) ── */}
        <View
          style={{
            width: BADGE_PANEL_WIDTH,
            height: chartHeight,
            backgroundColor: "rgba(220,232,255,0.72)",
            borderLeftWidth: 1,
            borderLeftColor: "rgba(88,128,255,0.18)",
            position: "relative",
          }}
        >
          {/* Subtle divider label */}
          <Text
            style={{
              position: "absolute",
              bottom: 6,
              left: 0,
              right: 0,
              textAlign: "center",
              color: "rgba(59,91,255,0.38)",
              fontSize: 8,
              fontWeight: "900",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Times
          </Text>

          {canRenderLeagueChart && badgePanelEntries.map(({ entry, y }) => (
            <View
              key={`panel-${entry.participantId}`}
              style={{
                position: "absolute",
                left: (BADGE_PANEL_WIDTH - BADGE_SIZE) / 2,
                top: y - BADGE_SIZE / 2,
              }}
            >
              <SeriesBadge
                badgeUrl={entry.badgeUrl}
                color={entry.color}
                initials={entry.initials}
                size={BADGE_SIZE}
              />
            </View>
          ))}

          {/* When no active rounds yet, show all series in stacked order */}
          {canRenderLeagueChart && activeRoundCount === 0 && series.map((entry, index) => {
            const spacing = Math.min((chartHeight - PADDING_TOP - PADDING_BOTTOM) / Math.max(series.length, 1), BADGE_SIZE + 6);
            const y = PADDING_TOP + index * spacing;
            return (
              <View
                key={`panel-idle-${entry.participantId}`}
                style={{
                  position: "absolute",
                  left: (BADGE_PANEL_WIDTH - BADGE_SIZE) / 2,
                  top: y,
                }}
              >
                <SeriesBadge
                  badgeUrl={entry.badgeUrl}
                  color={entry.color}
                  initials={entry.initials}
                  size={BADGE_SIZE}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Legend ── */}
      {canRenderLeagueChart ? (
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
                const currentPosition = series.findIndex((item) => item.participantId === entry.participantId) + 1;
                const previousPosition = previousPositionByParticipantId.get(entry.participantId);
                const movementMeta = getMovementMeta(
                  previousPosition && previousPosition > 0 ? previousPosition - currentPosition : 0,
                );
                return (
                  <View
                    key={`chip-${entry.participantId}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: `${entry.color}33`,
                      backgroundColor: "#FFFFFF",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: entry.color }} />
                    <Text style={{ color: "#1C2B4A", fontSize: 12, fontWeight: "900" }}>{entry.teamName}</Text>
                    <Text style={{ color: "#6B7EA3", fontSize: 12, fontWeight: "600" }}>
                      {entry.currentPoints} pts
                    </Text>
                    <View
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: movementMeta.borderColor,
                        backgroundColor: movementMeta.backgroundColor,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: movementMeta.color,
                          fontSize: 10,
                          fontWeight: "900",
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                        }}
                      >
                        {movementMeta.symbol} {movementMeta.label}
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
