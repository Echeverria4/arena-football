import { router } from "expo-router";
import { Text, View, useWindowDimensions } from "react-native";

import { TournamentCard } from "@/components/tournament/TournamentCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { sortCampeonatosBySeason } from "@/lib/season-tournaments";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";

export default function JogosScreen() {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const isPhone = width < 768;
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const { contentMaxWidth } = usePanelGrid();

  const ordered = sortCampeonatosBySeason(campeonatos);
  const active = ordered.filter((c) => c.status === "ativo");
  const archived = ordered.filter((c) => c.status === "finalizado");

  function openMatches(id: string) {
    router.push({ pathname: "/tournament/matches", params: { id } });
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
          eyebrow="Jogos"
          title="Rodadas e resultados"
          subtitle="Acompanhe as partidas de cada campeonato, confira os placares e navegue pelas rodadas da temporada."
        />

        {ordered.length === 0 ? (
          <ScreenState
            title="Nenhum campeonato ainda"
            description="Crie um campeonato na aba Torneios para começar a registrar jogos e resultados."
          />
        ) : null}

        {active.length > 0 ? (
          <View className="gap-4">
            <SectionHeader
              eyebrow="Em andamento"
              title="Temporadas ativas"
              subtitle="Campeonatos com rodadas abertas e jogos em andamento."
            />
            <View className="gap-5">
              {active.map((campeonato, index) => (
                <RevealOnScroll key={campeonato.id} delay={index * 70}>
                  <TournamentCard
                    tournament={campeonato}
                    surface="dark"
                    primaryAction={{
                      label: "Ver jogos",
                      onPress: () => openMatches(campeonato.id),
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
              subtitle="Histórico completo de partidas das temporadas já concluídas."
            />
            <View className="gap-5">
              {archived.map((campeonato, index) => (
                <RevealOnScroll key={campeonato.id} delay={index * 70}>
                  <TournamentCard
                    tournament={campeonato}
                    surface="dark"
                    primaryAction={{
                      label: "Ver histórico",
                      onPress: () => openMatches(campeonato.id),
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
