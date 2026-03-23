import { router } from "expo-router";
import { View } from "react-native";

import { TournamentCard } from "@/components/tournament/TournamentCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { sampleTournament } from "@/lib/constants";

export default function TournamentsScreen() {
  const { cardWidth, contentMaxWidth } = usePanelGrid();

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        <SectionHeader
          eyebrow="Campeonatos"
          title="Gerencie seus torneios"
          subtitle="Painel rapido para abrir o torneio ativo, criar novas competicoes e navegar pelas areas principais."
        />

        <View className="flex-row flex-wrap gap-5 px-2">
          <RevealOnScroll delay={0}>
            <FeatureCard
              icon="add-circle-outline"
              title="Novo campeonato"
              subtitle="Criacao imediata"
              description="Abra o wizard para configurar formato, participantes, regras, videos e premiacoes do proximo torneio."
              meta="Criar agora"
              onPress={() => router.push("/tournament/create")}
              width={cardWidth}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={90}>
            <FeatureCard
              icon="trophy-outline"
              title="Abrir campeonato"
              subtitle={sampleTournament.name}
              description="Entre no campeonato em andamento para acompanhar classificacao, regulamento, jogos e configuracoes."
              meta="Em andamento"
              onPress={() => router.push(`/tournament/${sampleTournament.id}`)}
              width={cardWidth}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={180}>
            <FeatureCard
              icon="git-network-outline"
              title="Acompanhar rodadas"
              subtitle="Grade e confrontos"
              description="Veja as fases, navegue entre rodadas e acompanhe todos os jogos ja liberados no torneio."
              meta="Abrir chaveamento"
              onPress={() =>
                router.push({ pathname: "/tournament/matches", params: { id: sampleTournament.id } })
              }
              width={cardWidth}
            />
          </RevealOnScroll>
        </View>

        <View className="gap-4 px-2">
          <SectionHeader
            eyebrow="Campeonato principal"
            title="Resumo do torneio ativo"
            subtitle="Leitura detalhada do campeonato principal mantendo o mesmo estilo de cards do painel."
          />

          <View className="flex-row flex-wrap gap-5">
            <RevealOnScroll delay={0} style={{ width: cardWidth }}>
              <TournamentCard
                tournament={sampleTournament}
                primaryAction={{
                  label: "Abrir campeonato",
                  onPress: () => router.push(`/tournament/${sampleTournament.id}`),
                }}
                secondaryAction={{
                  label: "Acompanhar rodadas",
                  onPress: () =>
                    router.push({ pathname: "/tournament/matches", params: { id: sampleTournament.id } }),
                  variant: "secondary",
                }}
              />
            </RevealOnScroll>

            <RevealOnScroll delay={90}>
              <FeatureCard
                icon="stats-chart-outline"
                title="Classificacao"
                subtitle="Grupo e geral"
                description="Veja tabela, aproveitamento, historico e estatisticas do torneio em um painel proprio."
                meta="Abrir tabela"
                onPress={() =>
                  router.push({ pathname: "/tournament/standings", params: { id: sampleTournament.id } })
                }
                width={cardWidth}
              />
            </RevealOnScroll>
          </View>
        </View>
      </View>
    </Screen>
  );
}
