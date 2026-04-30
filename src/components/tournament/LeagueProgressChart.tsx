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

// Landscape layout constants
// X axis = points (left → right), Y axis = rounds (top → bottom)
const PADDING_TOP = 26;      // space for X-axis (points) labels at top
const PADDING_BOTTOM = 8;
const PADDING_LEFT = 34;     // space for Y-axis (round) labels on left
const PADDING_RIGHT = 16;
const BADGE_PANEL_WIDTH = 68;
const BADGE_SIZE = 34;
const DOT_SIZE = 9;
const GRID_LINE_THICKNESS = 0.6;
const SEGMENT_THICKNESS = 2.5;
const SEGMENT_GLOW_THICKNESS = 6;
const MIN_ROW_HEIGHT = 44;
const MAX_ROW_HEIGHT = 80;

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
  if (index < SERIES_COLORS.length) return SERIES_COLORS[index];
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
  return [...list].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.teamName.localeCompare(b.teamName);
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
    .sort((a, b) => {
      if (b.currentPoints !== a.currentPoints) return b.currentPoints - a.currentPoints;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.teamName.localeCompare(b.teamName);
    });
}

// Landscape coordinate helpers
// X = points (horizontal), Y = round index (vertical)
function getXCoordinate(pointValue: number, xAxisMax: number, plotWidth: number): number {
  return PADDING_LEFT + (plotWidth * pointValue) / Math.max(xAxisMax, 1);
}

function getYCoordinate(roundIndex: number, visiblePointCount: number, plotHeight: number): number {
  return PADDING_TOP + (visiblePointCount <= 1 ? 0 : (plotHeight * roundIndex) / (visiblePointCount - 1));
}

function getCoordinates(
  roundIndex: number,
  pointValue: number,
  visiblePointCount: number,
  xAxisMax: number,
  plotWidth: number,
  plotHeight: number,
) {
  return {
    x: getXCoordinate(pointValue, xAxisMax, plotWidth),
    y: getYCoordinate(roundIndex, visiblePointCount, plotHeight),
  };
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

  // visiblePointCount = round 0 (start) + activeRoundCount
  const visiblePointCount = activeRoundCount + 1;
  // Number of intervals between consecutive points (gaps between rows)
  const numIntervals = Math.max(visiblePointCount - 1, 1);

  // X axis = points scale
  const maxVisiblePoints = Math.max(
    0,
    ...series.flatMap((entry) => entry.pointsByRound.slice(0, visiblePointCount)),
  );
  const tickStep = maxVisiblePoints <= 4 ? 1 : Math.ceil(maxVisiblePoints / 5);
  const tickCount = maxVisiblePoints <= 4 ? Math.max(maxVisiblePoints, 1) : 5;
  const xAxisMax = Math.max(tickStep * tickCount, 1);
  const xAxisValues = Array.from(
    { length: Math.floor(xAxisMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  // Chart dimensions — height grows with rounds, capped by screen
  const chartPanelWidth = containerWidth - BADGE_PANEL_WIDTH;
  const plotWidth = Math.max(chartPanelWidth - PADDING_LEFT - PADDING_RIGHT, 200);

  const maxContainerHeight = Math.min(Math.round(screenHeight * 0.65), isPhone ? 480 : 560);
  const availablePlotHeight = maxContainerHeight - PADDING_TOP - PADDING_BOTTOM;
  const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, Math.floor(availablePlotHeight / numIntervals)));
  const plotHeight = numIntervals * rowHeight;
  const chartHeight = plotHeight + PADDING_TOP + PADDING_BOTTOM;

  // Badge panel: team crests sorted by ranking, evenly spaced top→bottom
  const badgePanelEntries = useMemo(() => {
    const source = activeRoundCount > 0 ? visibleSeries : series;
    if (source.length === 0) return [];

    const availableH = chartHeight - PADDING_TOP - PADDING_BOTTOM;
    const spacing = Math.min(availableH / Math.max(source.length, 1), BADGE_SIZE + 6);

    return source.map((entry, index) => ({
      entry,
      y: PADDING_TOP + index * spacing,
    }));
  }, [visibleSeries, series, chartHeight, activeRoundCount]);

  const hasParticipants = campeonato.participantes.length > 0;
  const hasRounds = totalRounds > 0;
  const canRenderLeagueChart = hasParticipants && hasRounds;
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
      {/* ── Main chart row: scrollable chart + badge panel ── */}
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
        {/* ── Chart canvas ── */}
        <View style={{ flex: 1, backgroundColor: "#EDF4FF" }}>
          {canRenderLeagueChart ? (
            <View style={{ width: chartPanelWidth, height: chartHeight }}>

              {/* X-axis point-value labels at top + vertical grid lines */}
              {xAxisValues.map((pts) => {
                const x = getXCoordinate(pts, xAxisMax, plotWidth);
                return (
                  <View key={`pts-${pts}`}>
                    <View
                      style={{
                        position: "absolute",
                        left: x,
                        top: PADDING_TOP,
                        bottom: PADDING_BOTTOM,
                        width: GRID_LINE_THICKNESS,
                        backgroundColor: pts === 0
                          ? "rgba(59,91,255,0.18)"
                          : "rgba(59,91,255,0.07)",
                      }}
                    />
                    <Text
                      style={{
                        position: "absolute",
                        left: x - 12,
                        top: 5,
                        width: 24,
                        color: "#5E6E91",
                        fontSize: 10,
                        fontWeight: "800",
                        textAlign: "center",
                      }}
                    >
                      {pts}
                    </Text>
                  </View>
                );
              })}

              {/* Y-axis round labels on left + horizontal grid lines */}
              {Array.from({ length: visiblePointCount }, (_, i) => i).map((roundIndex) => {
                const y = getYCoordinate(roundIndex, visiblePointCount, plotHeight);
                const label = roundIndex === 0 ? "R0" : `R${roundIndex}`;
                return (
                  <View key={`round-${roundIndex}`}>
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
                        left: 2,
                        top: y - 8,
                        width: PADDING_LEFT - 4,
                        color: "#5E6E91",
                        fontSize: 10,
                        fontWeight: "800",
                        textAlign: "right",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}

              {/* Series line segments */}
              {visibleSeries.map((entry) => {
                const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);
                return visiblePoints.slice(1).map((pointValue, idx) => {
                  const start = getCoordinates(idx, visiblePoints[idx] ?? 0, visiblePointCount, xAxisMax, plotWidth, plotHeight);
                  const end = getCoordinates(idx + 1, pointValue, visiblePointCount, xAxisMax, plotWidth, plotHeight);
                  return (
                    <View key={`${entry.participantId}-seg-${idx}`}>
                      <View style={getSegmentGlowStyle(start.x, start.y, end.x, end.y, entry.color)} />
                      <View style={getSegmentStyle(start.x, start.y, end.x, end.y, entry.color)} />
                    </View>
                  );
                });
              })}

              {/* Terminal dots at each team's last visible point */}
              {activeRoundCount > 0 && visibleSeries.map((entry) => {
                const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);
                const finalValue = visiblePoints[visiblePoints.length - 1] ?? 0;
                const lastIdx = visiblePoints.length - 1;
                const { x, y } = getCoordinates(lastIdx, finalValue, visiblePointCount, xAxisMax, plotWidth, plotHeight);
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

              {/* Idle overlay */}
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
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                paddingHorizontal: 24,
                backgroundColor: "rgba(255,255,255,0.36)",
              }}
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

        {/* ── Badge panel (right) — team crests in ranking order ── */}
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
          ))}
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
                const currentPosition =
                  series.findIndex((item) => item.participantId === entry.participantId) + 1;
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
