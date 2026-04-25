import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SharedTournamentEntryScreen } from "@/components/tournament/SharedTournamentEntryScreen";
import { useAppStore } from "@/stores/app-store";

export default function ShortShareScreen() {
  const params = useLocalSearchParams<{
    access?: string | string[];
    data?: string | string[];
    key?: string | string[];
    payload?: string | string[];
  }>();
  const bootCompleted = useAppStore((state) => state.bootCompleted);
  const setBootCompleted = useAppStore((state) => state.setBootCompleted);
  const hydrated = useAppStore((state) => state.hydrated);

  // Visitantes que entram via link compartilhado pulam a tela de boot — ela
  // exige um toque manual e em alguns navegadores embutidos (WebView do
  // WhatsApp, navegadores Android antigos) o evento nao chega ou a tela
  // renderiza em branco. Marcamos boot como concluido direto e seguimos
  // para o SharedTournamentEntryScreen, que ja tem seu proprio loading.
  useEffect(() => {
    if (!hydrated) return;
    if (!bootCompleted) {
      setBootCompleted(true);
    }
  }, [hydrated, bootCompleted, setBootCompleted]);

  if (!hydrated) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <View className="gap-6 py-8">
          <ScreenState
            title="Abrindo link"
            description="Carregando o compartilhamento — aguarde alguns segundos."
            tone="light"
          />
        </View>
      </Screen>
    );
  }

  return (
    <SharedTournamentEntryScreen
      access={params.access}
      data={params.data}
      payload={params.payload}
      shareKey={params.key}
    />
  );
}
