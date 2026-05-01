import { router } from "expo-router";
import { View, useWindowDimensions } from "react-native";

import { TournamentCard } from "@/components/tournament/TournamentCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { sortCampeonatosBySeason } from "@/lib/season-tournaments";
import { useTournamentStore } from "@/stores/tournament-store";

export default function TabelaScreen() {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const isPhone = width < 768;
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const { contentMaxWidth } = usePanelGrid();

  const ordered = sortCampeonatosBySeason(campeonatos);
  const active = ordered.filter((c) => c.status === "ativo");
  const archived = ordered.filter((c) => c.status === "finalizado");

  function openStandings(id: string) {
    router.push({ pathname: "/tournament/standings", params: { id } });
  }

  return (
    <Screen
      scroll
      className={isSmallPhone ? "px-4" : "px-6"}
    >
      <View
        className="w-full self-center"
        style={{
          maxWidth: contentMaxWidth,
          gap: isSmallPhone ? 20 : isPhone ? 24 : 32,
          paddingVertical: isSmallPhone ? 16 : 24,
        }}
      >
        <SectionHeader
          eyebrow="Tabela"
          title="Classificação"
          subtitle="Pontuação, saldo de gols, forma recente e posição atualizada de cada participante por temporada."
        />

        {ordered.length === 0 ? (
          <ScreenState
            title="Nenhum campeonato ainda"
            description="Crie um campeonato na aba Torneios para acompanhar a tabela de classificação."
          />
        ) : null}

        {active.length > 0 ? (
          <View className="gap-4">
            <SectionHeader
              eyebrow="Em andamento"
              title="Temporadas ativas"
              subtitle="Tabela de pontos atualizada com as rodadas em andamento."
            />
            <View className="gap-5">
              {active.map((campeonato, index) => (
                <RevealOnScroll key={campeonato.id} delay={index * 70}>
                  <TournamentCard
                    tournament={campeonato}
                    surface="dark"
                    primaryAction={{
                      label: "Ver tabela",
                      onPress: () => openStandings(campeonato.id),
                    }}
                  />
                </RevealOnScroll>
              ))}
            </View>
          </View>
        ) : null}

        {archived.length > 0 ? (
          <View className="gap-4">
            <SectionHeader
              eyebrow="Encerrados"
              title="Temporadas finalizadas"
              subtitle="Classificação final com o pódio de cada temporada encerrada."
            />
            <View className="gap-5">
              {archived.map((campeonato, index) => (
                <RevealOnScroll key={campeonato.id} delay={index * 70}>
                  <TournamentCard
                    tournament={campeonato}
                    surface="dark"
                    primaryAction={{
                      label: "Ver classificação",
                      onPress: () => openStandings(campeonato.id),
                    }}
                  />
                </RevealOnScroll>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
