import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { StandingsTable } from "@/components/standings/StandingsTable";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { GlassCard } from "@/components/ui/GlassCard";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import {
  sampleHistoricalPerformance,
  sampleParticipants,
  sampleStandings,
  sampleTournament,
} from "@/lib/constants";

export default function TournamentStandingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [groupedView, setGroupedView] = useState(true);

  return (
    <Screen scroll className="px-6" backgroundVariant="soft">
      <View className="min-h-full gap-6 py-8">
        <View className="gap-2">
          <Text className="text-base uppercase tracking-[3px] text-arena-text">Classificacao</Text>
          <Text className="text-4xl font-bold text-arena-text">{sampleTournament.name}</Text>
          <Text className="text-lg leading-7 text-arena-muted">
            Visualize a fase atual, acompanhe os grupos e veja como o campeonato {id} esta se desenhando.
          </Text>
        </View>

        <GlassCard className="gap-5 border-arena-neon/20">
          <View className="gap-2">
            <Text className="text-sm uppercase tracking-[3px] text-arena-text">Painel da fase</Text>
            <Text className="text-xl font-semibold text-arena-text">Classificacao no estilo do Arena</Text>
            <Text className="text-base leading-7 text-arena-muted">
              A tabela agora usa fundo escuro, destaques neon e leitura mais alinhada com o restante do aplicativo.
            </Text>
          </View>

          <Pressable
            className="self-start rounded-[24px] border border-arena-neon bg-arena-neon/18 px-5 py-4"
            onPress={() => router.push({ pathname: "/tournament/statistics", params: { id } })}
          >
            <View className="gap-1">
              <Text className="text-sm uppercase tracking-[2px] text-arena-text">Fase ativa</Text>
              <Text className="text-3xl font-semibold text-arena-text">1a Fase</Text>
              <Text className="text-base text-arena-text">Toque para abrir estatisticas de ataque e defesa</Text>
            </View>
          </Pressable>

          <View className="gap-3">
            <Text className="text-sm uppercase tracking-[2px] text-arena-text">Modo de visualizacao</Text>
            <ScrollRow>
              <ChoiceChip
                label="Classificacao por grupo"
                active={groupedView}
                onPress={() => setGroupedView(true)}
              />
              <ChoiceChip
                label="Classificacao geral"
                active={!groupedView}
                onPress={() => setGroupedView(false)}
              />
            </ScrollRow>
          </View>

          <View className="rounded-2xl border border-arena-line bg-arena-card px-4 py-4">
            <Text className="text-sm uppercase tracking-[2px] text-arena-text">Leitura rapida</Text>
            <Text className="mt-2 text-base leading-7 text-arena-text">
              {groupedView
                ? "Cada grupo mostra pontuacao, historico, aproveitamento atual e probabilidade estimada de vitoria."
                : "A classificacao geral consolida todos os participantes em um unico quadro de desempenho."}
            </Text>
          </View>
        </GlassCard>

        <View className="pb-8">
          <StandingsTable
            standings={sampleStandings}
            participants={sampleParticipants}
            historicalPerformance={sampleHistoricalPerformance}
            grouped={groupedView}
          />
        </View>
      </View>
    </Screen>
  );
}
