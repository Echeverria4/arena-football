import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useTournamentStore } from "@/stores/tournament-store";

function TournamentDeadlineAutoSync() {
  const hydrated = useTournamentStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const sync = () => {
      useTournamentStore.getState().sincronizarPrazosRodadas();
    };

    sync();
    const interval = setInterval(sync, 1000);

    return () => clearInterval(interval);
  }, [hydrated]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, width: "100%", minHeight: 0 }}>
      <TournamentDeadlineAutoSync />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050A11", flex: 1, width: "100%", maxWidth: "100vw" as never, minHeight: 0, overflow: "hidden" as never },
          animation: "fade",
        }}
      />
    </GestureHandlerRootView>
  );
}
