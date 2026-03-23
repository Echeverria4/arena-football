import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Screen } from "@/components/ui/Screen";
import { sampleParticipants, sampleStandings, sampleTournament } from "@/lib/constants";

function buildAttackRanking() {
  return sampleStandings
    .map((entry) => ({
      ...entry,
      participant: sampleParticipants.find((participant) => participant.id === entry.participantId),
    }))
    .filter((entry) => entry.participant)
    .sort((current, next) => {
      if (next.goalsFor !== current.goalsFor) {
        return next.goalsFor - current.goalsFor;
      }

      if (next.goalDifference !== current.goalDifference) {
        return next.goalDifference - current.goalDifference;
      }

      return next.points - current.points;
    });
}

function buildDefenseRanking() {
  return sampleStandings
    .map((entry) => ({
      ...entry,
      participant: sampleParticipants.find((participant) => participant.id === entry.participantId),
    }))
    .filter((entry) => entry.participant)
    .sort((current, next) => {
      if (current.goalsAgainst !== next.goalsAgainst) {
        return current.goalsAgainst - next.goalsAgainst;
      }

      if (next.goalDifference !== current.goalDifference) {
        return next.goalDifference - current.goalDifference;
      }

      return next.points - current.points;
    });
}

interface StatisticsSectionProps {
  title: string;
  statLabel: string;
  statKey: "goalsFor" | "goalsAgainst";
  entries: ReturnType<typeof buildAttackRanking>;
}

function StatisticsSection({ title, statLabel, statKey, entries }: StatisticsSectionProps) {
  return (
    <GlassCard className="gap-0 overflow-hidden border-arena-neon/20">
      <View className="bg-arena-neon/18 px-5 py-4">
        <Text className="text-center text-4xl font-bold text-arena-text">{title}</Text>
      </View>

      <View className="flex-row items-center border-b border-arena-line bg-[#0A140E] px-4 py-3">
        <Text className="flex-1 text-lg font-semibold text-arena-text">Equipes</Text>
        <Text className="w-16 text-right text-lg font-semibold text-arena-text">{statLabel}</Text>
      </View>

      {entries.map((entry, index) => (
        <View
          key={`${title}-${entry.participantId}`}
          className={`flex-row items-center px-4 py-4 ${
            index % 2 === 0 ? "bg-[#0C1711]" : "bg-[#101D16]"
          }`}
        >
          <Text className="w-10 text-center text-3xl font-bold text-arena-text">{index + 1}</Text>
          <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#102016]">
            <Ionicons name="shield-outline" size={28} color="#9AE2B2" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-2xl font-semibold text-arena-text">{entry.participant?.teamName}</Text>
            <Text className="text-sm text-arena-muted">{entry.participant?.displayName}</Text>
          </View>
          <Text className="w-16 text-right text-4xl font-bold text-arena-text">{entry[statKey]}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

export default function TournamentStatisticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const attackRanking = buildAttackRanking();
  const defenseRanking = buildDefenseRanking();

  return (
    <Screen scroll className="px-6" backgroundVariant="soft">
      <View className="gap-6 py-8">
        <View className="gap-2">
          <Text className="text-base uppercase tracking-[3px] text-arena-text">Estatisticas</Text>
          <Text className="text-4xl font-bold text-arena-text">{sampleTournament.name}</Text>
          <Text className="text-lg leading-7 text-arena-muted">
            Ranking de desempenho ofensivo e defensivo do campeonato {id}.
          </Text>
        </View>

        <GlassCard className="gap-4 border-arena-neon/20">
          <View className="gap-2">
            <Text className="text-sm uppercase tracking-[3px] text-arena-text">Navegacao</Text>
            <Text className="text-xl font-semibold text-arena-text">Painel de estatisticas</Text>
            <Text className="text-base leading-7 text-arena-muted">
              Aqui voce acompanha melhor ataque e melhor defesa em formato de ranking.
            </Text>
          </View>

          <Pressable
            className="self-start rounded-[24px] border border-arena-line bg-arena-card px-5 py-4"
            onPress={() => router.push({ pathname: "/tournament/standings", params: { id } })}
          >
            <Text className="text-lg font-semibold uppercase tracking-[2px] text-arena-text">
              Voltar para classificacao
            </Text>
          </Pressable>
        </GlassCard>

        <StatisticsSection
          title="Melhor Ataque"
          statLabel="Gols"
          statKey="goalsFor"
          entries={attackRanking}
        />

        <StatisticsSection
          title="Melhor Defesa"
          statLabel="Gols"
          statKey="goalsAgainst"
          entries={defenseRanking}
        />
      </View>
    </Screen>
  );
}
