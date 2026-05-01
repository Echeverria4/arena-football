import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";

export default function JogosScreen() {
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const hydrated = useTournamentDataHydrated();

  const activeCampeonatos = campeonatos.filter((c) => c.status === "ativo");
  const targetId = currentTournamentId ?? activeCampeonatos[0]?.id;

  useEffect(() => {
    if (!hydrated) return;
    if (targetId) {
      router.push({ pathname: "/tournament/matches", params: { id: targetId } });
    }
  }, [hydrated, targetId]);

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
          <ScreenState title="Carregando jogos" description="Sincronizando rodadas e resultados." />
        </View>
      </Screen>
    );
  }

  if (!targetId) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
          <ScreenState
            title="Nenhum campeonato ativo"
            description="Crie um campeonato na aba Torneios para começar a registrar jogos e resultados."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
        <Text style={{ color: "#5B7FC4", fontSize: 14 }}>Redirecionando para os jogos...</Text>
      </View>
    </Screen>
  );
}
