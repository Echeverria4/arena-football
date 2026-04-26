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
const PADDING_RIGHT = 28;
const MARKER_SIZE = 32;
const X_AXIS_LABEL_WIDTH = 24;
const GRID_LINE_THICKNESS = 0.6;
const SEGMENT_THICKNESS = 2.5;
const SEGMENT_GLOW_THICKNESS = 6;

function SeriesBadge({
  badgeUrl,
  color,
  initials,
  size = MARKER_SIZE,
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
        borderWidth: 1,
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
          <Text style={{ color, fontSize: 8, fontWeight: "900" }}>{initials}</Text>
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
    if (next.points !== current.points) {
      return next.points - current.points;
    }

    if (next.goalDifference !== current.goalDifference) {
      return next.goalDifference - current.goalDifference;
    }

    if (next.goalsFor !== current.goalsFor) {
      return next.goalsFor - current.goalsFor;
    }

    if (next.wins !== current.wins) {
      return next.wins - current.wins;
    }

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
      ) {
        return;
      }

      const home = standings.get(match.mandanteId);
      const away = standings.get(match.visitanteId);

      if (!home || !away) {
        return;
      }

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
      if (next.currentPoints !== current.currentPoints) {
        return next.currentPoints - current.currentPoints;
      }

      if (next.goalDifference !== current.goalDifference) {
        return next.goalDifference - current.goalDifference;
      }

      if (next.wins !== current.wins) {
        return next.wins - current.wins;
      }

      return current.teamName.localeCompare(next.teamName);
    });
}

function getPointCoordinates(
  pointIndex: number,
  pointValue: number,
  totalPoints: number,
  maxPoints: number,
  plotWidth: number,
  plotHeight: number,
) {
  const safeMaxPoints = Math.max(maxPoints, 1);
  const horizontalDivisor = Math.max(totalPoints - 1, 1);
  const x =
    PADDING_LEFT + (totalPoints <= 1 ? 0 : (plotWidth * pointIndex) / horizontalDivisor);
  const y = PADDING_TOP + plotHeight - (plotHeight * pointValue) / safeMaxPoints;

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
  const { width: screenWidth } = useWindowDimensions();
  const isPhone = screenWidth < 768;
  const [chartViewportWidth, setChartViewportWidth] = useState(420);
  const [legendVisible, setLegendVisible] = useState(true);
  const series = useMemo(() => buildSeries(campeonato), [campeonato]);
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
    () =>
      new Map(
        previousRoundStandings.map((entry, index) => [entry.participanteId, index + 1]),
      ),
    [previousRoundStandings],
  );
  const totalRounds = Math.max(campeonato.rodadas.length, 0);
  const activeRoundCount =
    totalRounds > 0
      ? campeonato.rodadas.reduce(
          (lastRoundIndex, round, roundIndex) =>
            round.some((match) => match.status === "finalizado") ? roundIndex + 1 : lastRoundIndex,
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
  const chartHeight = isPhone ? 260 : 440;
  const pointSpacing = isPhone ? 64 : 92;
  const chartCanvasWidth = Math.max(
    chartViewportWidth,
    PADDING_LEFT + PADDING_RIGHT + Math.max(isPhone ? 280 : 420, Math.max(visiblePointCount - 1, 1) * pointSpacing),
  );
  const plotWidth = Math.max(chartCanvasWidth - PADDING_LEFT - PADDING_RIGHT, 260);
  const plotHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;
  const hasParticipants = campeonato.participantes.length > 0;
  const hasRounds = totalRounds > 0;
  const canRenderLeagueChart = hasParticipants && hasRounds;
  const xAxisLabels = Array.from({ length: visiblePointCount }, (_, index) => index);
  const emptyStateTitle = !hasParticipants
    ? "Campeonato sem participantes"
    : "Rodadas ainda nao geradas";
  const emptyStateDescription = !hasParticipants
    ? "Este campeonato foi salvo sem jogadores vinculados. Enquanto isso nao for corrigido, nao ha linha de evolucao para mostrar."
    : format === "groups" || format === "groups_knockout"
      ? "O campeonato esta na fase de grupos, mas ainda nao existem rodadas finalizadas para montar a curva de evolucao."
      : "O campeonato esta em pontos corridos, mas ainda nao existem confrontos estruturados para montar a curva de evolucao.";

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.max(Math.round(event.nativeEvent.layout.width), 320);

    if (Math.abs(nextWidth - chartViewportWidth) > 4) {
      setChartViewportWidth(nextWidth);
    }
  }

  if (format === "knockout") return null;

  return (
    <View className="gap-4">
      <View className="gap-3">
        <View
          onLayout={handleLayout}
          style={{
            height: chartHeight,
            borderRadius: 22,
            overflow: "hidden",
            position: "relative",
            borderWidth: 1,
            borderColor: "rgba(88,128,255,0.22)",
            backgroundColor: "#EDF4FF",
          }}
        >
          {canRenderLeagueChart ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ minWidth: chartCanvasWidth }}
            >
              <View
                style={{
                  width: chartCanvasWidth,
                  height: chartHeight,
                }}
              >
                {yAxisValues.map((label) => {
                  const point = getPointCoordinates(
                    0,
                    label,
                    visiblePointCount,
                    yAxisMax,
                    plotWidth,
                    plotHeight,
                  );

                  return (
                    <View key={`grid-y-${label}`}>
                      <View
                        style={{
                          position: "absolute",
                          left: PADDING_LEFT,
                          right: PADDING_RIGHT,
                          top: point.y,
                          height: GRID_LINE_THICKNESS,
                          backgroundColor: "rgba(59,91,255,0.10)",
                        }}
                      />
                      <Text
                        style={{
                          position: "absolute",
                          left: 8,
                          top: point.y - 8,
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

                {xAxisLabels.map((label, index) => {
                  const point = getPointCoordinates(
                    index,
                    0,
                    visiblePointCount,
                    yAxisMax,
                    plotWidth,
                    plotHeight,
                  );

                  return (
                    <View
                      key={`grid-x-${label}`}
                      style={{
                        position: "absolute",
                        left: point.x,
                        top: PADDING_TOP,
                        bottom: PADDING_BOTTOM,
                        width: GRID_LINE_THICKNESS,
                        backgroundColor: "rgba(59,91,255,0.06)",
                      }}
                    />
                  );
                })}

                {series.map((entry) => {
                  const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);

                  return visiblePoints.slice(1).map((pointValue, index) => {
                    const start = getPointCoordinates(
                      index,
                      visiblePoints[index] ?? 0,
                      visiblePointCount,
                      yAxisMax,
                      plotWidth,
                      plotHeight,
                    );
                    const end = getPointCoordinates(
                      index + 1,
                      pointValue,
                      visiblePointCount,
                      yAxisMax,
                      plotWidth,
                      plotHeight,
                    );

                    return (
                      <View key={`${entry.participantId}-segment-${index}`}>
                        <View style={getSegmentGlowStyle(start.x, start.y, end.x, end.y, entry.color)} />
                        <View style={getSegmentStyle(start.x, start.y, end.x, end.y, entry.color)} />
                      </View>
                    );
                  });
                })}

                {activeRoundCount > 0
                  ? (() => {
                      // Para evitar que badges de times empatados em pontos
                      // se sobreponham (mesma coordenada Y e X final), agrupamos
                      // por valor final e distribuimos horizontalmente — o time
                      // melhor classificado (primeiro do series ja ordenado por
                      // criterios) fica mais a direita; os demais escalonam para
                      // a esquerda em linhas (wraps verticais quando o cluster
                      // ficaria muito largo).
                      const ringSize = MARKER_SIZE + 4;
                      const horizontalGap = 6;
                      const verticalGap = 4;
                      const horizontalStep = ringSize + horizontalGap;
                      const verticalStep = ringSize + verticalGap;
                      const maxPerRow = Math.max(
                        1,
                        Math.floor((plotWidth - 8) / horizontalStep),
                      );

                      const rawMarkers = series.map((entry) => {
                        const visiblePoints = entry.pointsByRound.slice(0, visiblePointCount);
                        const finalValue = visiblePoints[visiblePoints.length - 1] ?? 0;
                        const finalPoint = getPointCoordinates(
                          Math.max(visiblePoints.length - 1, 0),
                          finalValue,
                          visiblePointCount,
                          yAxisMax,
                          plotWidth,
                          plotHeight,
                        );
                        return { entry, finalValue, finalPoint };
                      });

                      const clusters = new Map<number, typeof rawMarkers>();
                      rawMarkers.forEach((marker) => {
                        const list = clusters.get(marker.finalValue) ?? [];
                        list.push(marker);
                        clusters.set(marker.finalValue, list);
                      });

                      const placed: Array<{
                        entry: SeriesEntry;
                        x: number;
                        y: number;
                      }> = [];

                      clusters.forEach((cluster) => {
                        cluster.forEach((marker, indexInCluster) => {
                          const row = Math.floor(indexInCluster / maxPerRow);
                          const col = indexInCluster % maxPerRow;
                          // O time melhor ranqueado (col=0) fica na posicao
                          // original (mais a direita). Os demais escalonam
                          // para a esquerda na mesma linha.
                          const x = marker.finalPoint.x - col * horizontalStep;
                          // Quando ha varias linhas (cluster maior que cabe na
                          // horizontal), as linhas seguintes sobem para nao
                          // colidir com o eixo X.
                          const y = marker.finalPoint.y - row * verticalStep;
                          placed.push({ entry: marker.entry, x, y });
                        });
                      });

                      return placed.map(({ entry, x, y }) => (
                        <View
                          key={`${entry.participantId}-marker`}
                          style={{
                            position: "absolute",
                            left: x - ringSize / 2,
                            top: y - ringSize / 2,
                          }}
                        >
                          <SeriesBadge
                            badgeUrl={entry.badgeUrl}
                            color={entry.color}
                            initials={entry.initials}
                            size={ringSize}
                          />
                        </View>
                      ));
                    })()
                  : null}

                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 8,
                    height: 18,
                  }}
                >
                  {xAxisLabels.map((label, index) => {
                    const point = getPointCoordinates(
                      index,
                      0,
                      visiblePointCount,
                      yAxisMax,
                      plotWidth,
                      plotHeight,
                    );

                    return (
                      <Text
                        key={`round-label-${label}`}
                        style={{
                          position: "absolute",
                          left: point.x - X_AXIS_LABEL_WIDTH / 2,
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
              className="items-center justify-center gap-3 px-6"
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.36)" }}
            >
              <Text className="text-center text-lg font-black text-[#1C2B4A]">
                {emptyStateTitle}
              </Text>
              <Text className="text-center text-sm leading-6 text-[#6B7EA3]">
                {emptyStateDescription}
              </Text>
            </View>
          )}
        </View>

        {canRenderLeagueChart ? (
          <View className="gap-2">
            <Pressable
              onPress={() => setLegendVisible((v) => !v)}
              className="self-start flex-row items-center gap-1"
              style={{ paddingVertical: 2 }}
            >
              <Text style={{ color: "#5678C9", fontSize: 12, fontWeight: "700", letterSpacing: 1.2 }}>
                {legendVisible ? "Ocultar times" : "Mostrar times"}
              </Text>
              <Ionicons
                name={legendVisible ? "chevron-up" : "chevron-down"}
                size={14}
                color="#5678C9"
              />
            </Pressable>

            {legendVisible ? (
            <View className="flex-row flex-wrap gap-2">
            {series.map((entry) => (
              <View
                key={`chip-${entry.participantId}`}
                className="flex-row items-center gap-2 rounded-full border px-3 py-2"
                style={{
                  borderColor: `${entry.color}33`,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  className="rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: entry.color,
                  }}
                />
                <Text className="text-xs font-black text-[#1C2B4A]">{entry.teamName}</Text>
                <Text className="text-xs font-semibold text-[#6B7EA3]">
                  {entry.currentPoints} pts
                </Text>
                {(() => {
                  const currentPosition = series.findIndex((item) => item.participantId === entry.participantId) + 1;
                  const previousPosition = previousPositionByParticipantId.get(entry.participantId);
                  const movementMeta = getMovementMeta(
                    previousPosition && previousPosition > 0 ? previousPosition - currentPosition : 0,
                  );

                  return (
                    <View
                      className="rounded-full border px-2 py-1"
                      style={{
                        backgroundColor: movementMeta.backgroundColor,
                        borderColor: movementMeta.borderColor,
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
                  );
                })()}
              </View>
            ))}
          </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
