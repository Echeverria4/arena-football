import { router } from "expo-router";
import { View } from "react-native";

import { TournamentCard } from "@/components/tournament/TournamentCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getActiveCampeonatos } from "@/lib/tournament-display";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";

export default function TournamentListScreen() {
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const ativos = getActiveCampeonatos(campeonatos);

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-8">
        <SectionHeader
          eyebrow="Abrir campeonato"
          title="Campeonatos ativos"
          subtitle="Lista premium dos campeonatos disponíveis para entrar, acompanhar rodadas e abrir as áreas internas."
        />

        <View className="gap-5">
          {ativos.map((camp, index) => (
            <RevealOnScroll key={camp.id} delay={index * 70}>
              <TournamentCard
                tournament={camp}
                primaryAction={{
                  label: "Entrar no campeonato",
                  onPress: () => {
                    setCurrentTournamentId(camp.id);
                    router.push(`/tournament/${camp.id}`);
                  },
                }}
                secondaryAction={{
                  label: "Ver classificacao",
                  onPress: () => {
                    setCurrentTournamentId(camp.id);
                    router.push({ pathname: "/tournament/standings", params: { id: camp.id } });
                  },
                  variant: "secondary",
                }}
              />
            </RevealOnScroll>
          ))}
        </View>
      </View>
    </Screen>
  );
}
