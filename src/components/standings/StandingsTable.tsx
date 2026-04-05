import { Ionicons } from "@expo/vector-icons";
import { Text, View, useWindowDimensions } from "react-native";

import { formatPercent } from "@/lib/formatters";
import type { HistoricalPerformance, StandingEntry, TournamentParticipant } from "@/types/tournament";

interface StandingsTableProps {
  standings: StandingEntry[];
  participants: TournamentParticipant[];
  historicalPerformance: HistoricalPerformance[];
  grouped?: boolean;
}

interface GroupedStandingEntry extends StandingEntry {
  participant: TournamentParticipant;
}

const statColumns = [
  { key: "points", label: "P" },
  { key: "played", label: "J" },
  { key: "wins", label: "V" },
  { key: "draws", label: "E" },
  { key: "losses", label: "D" },
] as const;

export function StandingsTable({
  standings,
  participants,
  historicalPerformance,
  grouped = true,
}: StandingsTableProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;

  function calculateHistoricalWinRate(record?: HistoricalPerformance) {
    if (!record || record.matchesPlayed === 0) {
      return 0;
    }

    return (record.wins / record.matchesPlayed) * 100;
  }

  function calculateCurrentCampaignRate(entry: StandingEntry) {
    if (entry.played === 0) {
      return 0;
    }

    return (entry.points / (entry.played * 3)) * 100;
  }

  function calculateCurrentVictoryRate(entry: StandingEntry) {
    if (entry.played === 0) {
      return 0;
    }

    return (entry.wins / entry.played) * 100;
  }

  function calculateGoalMomentum(entry: StandingEntry) {
    if (entry.played === 0) {
      return 50;
    }

    const base = 50 + (entry.goalDifference / entry.played) * 12;
    return Math.max(20, Math.min(85, base));
  }

  function estimateVictoryProbability(entry: StandingEntry, record?: HistoricalPerformance) {
    const historicalWinRate = calculateHistoricalWinRate(record);
    const currentCampaignRate = calculateCurrentCampaignRate(entry);
    const currentVictoryRate = calculateCurrentVictoryRate(entry);
    const goalMomentum = calculateGoalMomentum(entry);
    const titleBonus = (record?.titles ?? 0) * 1.5;

    const estimated =
      historicalWinRate * 0.35 +
      currentCampaignRate * 0.35 +
      currentVictoryRate * 0.15 +
      goalMomentum * 0.15 +
      titleBonus;

    return Math.max(5, Math.min(95, estimated));
  }

  const groupedEntries = standings.reduce<Record<string, GroupedStandingEntry[]>>((accumulator, standing) => {
    const participant = participants.find((item) => item.id === standing.participantId);

    if (!participant) {
      return accumulator;
    }

    const groupName = grouped ? participant.groupName ?? "Geral" : "Classificacao geral";

    if (!accumulator[groupName]) {
      accumulator[groupName] = [];
    }

    accumulator[groupName].push({ ...standing, participant });
    accumulator[groupName].sort((current, next) => {
      if (next.points !== current.points) {
        return next.points - current.points;
      }

      if (next.goalDifference !== current.goalDifference) {
        return next.goalDifference - current.goalDifference;
      }

      return next.goalsFor - current.goalsFor;
    });

    return accumulator;
  }, {});

  const orderedGroups = Object.entries(groupedEntries).sort(([current], [next]) => current.localeCompare(next));

  return (
    <View className="gap-5">
      {orderedGroups.map(([groupName, groupStandings]) => (
        <View
          key={groupName}
          className="overflow-hidden rounded-[30px] border border-arena-line bg-arena-card/95"
        >
          <View
            className={`items-center border-b border-arena-neon/20 bg-[#0A140E] px-4 py-4 ${
              isPhone ? "gap-3" : "flex-row"
            }`}
          >
            <View className="flex-1">
              <View className="self-start rounded-full border border-arena-neon/35 bg-arena-neon/12 px-3 py-1">
                <Text className="text-xs font-semibold uppercase tracking-[2px] text-[#CFFFD9]">{groupName}</Text>
              </View>
            </View>
            {isPhone ? (
              <View className="w-full flex-row flex-wrap gap-2">
                {statColumns.map((column) => (
                  <View
                    key={column.key}
                    className="rounded-full border border-arena-line/70 bg-[#0F1A14] px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-[#C6F8D6]">
                      {column.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              statColumns.map((column) => (
                <Text
                  key={column.key}
                  className="w-12 text-center text-sm font-semibold uppercase text-[#C6F8D6]"
                >
                  {column.label}
                </Text>
              ))
            )}
          </View>

          {groupStandings.map((entry, index) => {
            const history = historicalPerformance.find((item) => item.userId === entry.participant.userId);
            const historicalWinRate = calculateHistoricalWinRate(history);
            const currentCampaignRate = calculateCurrentCampaignRate(entry);
            const currentVictoryRate = calculateCurrentVictoryRate(entry);
            const winProbability = estimateVictoryProbability(entry, history);

            return (
              <View
                key={entry.participantId}
                className={`${isPhone ? "gap-3 px-3 py-4" : "flex-row items-stretch"} ${
                  index === groupStandings.length - 1 ? "" : "border-b border-arena-line/70"
                }`}
              >
                <View className={`flex-1 ${isPhone ? "gap-3" : "flex-row items-center gap-3 px-3 py-4"}`}>
                  <View
                    className={`items-center justify-center rounded-2xl border ${
                      index === 0
                        ? "border-arena-neon/45 bg-arena-neon/12"
                        : "border-arena-line bg-[#0F1A14]"
                    }`}
                    style={{ width: isPhone ? 40 : 44, height: isPhone ? 40 : 44 }}
                  >
                    <Text
                      className={`font-bold ${
                        index === 0 ? "text-arena-neon" : "text-[#C6F8D6]"
                      }`}
                      style={{ fontSize: isPhone ? 16 : 18 }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View
                    className="items-center justify-center rounded-2xl border border-arena-line bg-arena-surface"
                    style={{ width: isPhone ? 52 : 56, height: isPhone ? 52 : 56 }}
                  >
                    <Ionicons
                      name={index === 0 ? "trophy" : "trophy-outline"}
                      size={isPhone ? 24 : 28}
                      color={index === 0 ? "#C9FF72" : "#57FF7C"}
                    />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="font-semibold text-arena-text" style={{ fontSize: isPhone ? 17 : 18 }}>
                      {entry.participant.teamName}
                    </Text>
                    <Text className="text-xs text-arena-muted">{entry.participant.displayName}</Text>
                    <Text className="text-xs font-medium text-[#C6F8D6]">
                      Hist. {formatPercent(historicalWinRate)} | V atual {formatPercent(currentVictoryRate)}
                    </Text>
                    <Text className="text-xs font-medium text-[#B9C4DA]">
                      Camp. {formatPercent(currentCampaignRate)} no campeonato atual
                    </Text>
                    <Text className="text-xs font-semibold text-arena-neon">
                      Prob. de vitoria {formatPercent(winProbability)}
                    </Text>
                  </View>
                </View>

                {isPhone ? (
                  <View className="flex-row flex-wrap gap-2">
                    {statColumns.map((column, columnIndex) => (
                      <View
                        key={column.key}
                        className={`min-w-[72px] flex-1 rounded-2xl border border-arena-line/70 px-3 py-2.5 ${
                          columnIndex % 2 === 0 ? "bg-[#08110C]" : "bg-[#0D1711]"
                        }`}
                      >
                        <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[#C6F8D6]">
                          {column.label}
                        </Text>
                        <Text
                          className={`mt-1 text-lg font-semibold ${
                            column.key === "points" ? "text-arena-neon" : "text-arena-text"
                          }`}
                        >
                          {entry[column.key]}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  statColumns.map((column, columnIndex) => (
                    <View
                      key={column.key}
                      className={`w-12 items-center justify-center border-l border-arena-line/70 ${
                        columnIndex % 2 === 0 ? "bg-[#08110C]" : "bg-[#0D1711]"
                      }`}
                    >
                      <Text
                        className={`text-lg font-semibold ${
                          column.key === "points" ? "text-arena-neon" : "text-arena-text"
                        }`}
                      >
                        {entry[column.key]}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>
      ))}

      <View className="gap-2 rounded-[28px] border border-arena-line bg-arena-card/90 px-4 py-4">
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>P - Pontos</Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>J - Jogos</Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>V - Vitorias</Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>E - Empates</Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>D - Derrotas</Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>
          Hist. - Percentual de vitorias em campeonatos anteriores
        </Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>
          V atual - Percentual de vitorias dentro do campeonato atual
        </Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>
          Camp. - Aproveitamento atual no campeonato
        </Text>
        <Text className="font-medium text-arena-text" style={{ fontSize: isSmallPhone ? 15 : 16 }}>
          Prob. de vitoria - Estimativa baseada em historico e campanha atual
        </Text>
      </View>
    </View>
  );
}
