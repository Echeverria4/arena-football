import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";

export default function TabelaScreen() {
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const hydrated = useTournamentDataHydrated();

  const activeCampeonatos = campeonatos.filter((c) => c.status === "ativo");
  const targetId = currentTournamentId ?? activeCampeonatos[0]?.id;

  useEffect(() => {
    if (!hydrated) return;
    if (targetId) {
      router.push({ pathname: "/tournament/standings", params: { id: targetId } });
    }
  }, [hydrated, targetId]);

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
          <ScreenState title="Carregando tabela" description="Sincronizando classificação e pontuação." />
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
            description="Crie um campeonato na aba Torneios para acompanhar a classificação."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
        <Text style={{ color: "#5B7FC4", fontSize: 14 }}>Redirecionando para a tabela...</Text>
      </View>
    </Screen>
  );
}
