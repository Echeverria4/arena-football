import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";

function TournamentDeadlineAutoSync() {
  const hydrated = useTournamentStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const sync = () => useTournamentStore.getState().sincronizarPrazosRodadas();
    sync();
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, [hydrated]);

  return null;
}

export default function RootLayout() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);
  const segments = useSegments();
  const router = useRouter();
  const hydrationStarted = useRef(false);

  // Restore session once on mount
  useEffect(() => {
    if (!hydrationStarted.current) {
      hydrationStarted.current = true;
      void hydrateSession();
    }
  }, [hydrateSession]);

  // Auth guard — runs whenever route or auth state changes
  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    // Only block the main app tabs — /tournament/* stays open for shared-link viewers
    const inProtectedGroup = segments[0] === "(tabs)";

    if (status === "guest" && inProtectedGroup) {
      router.replace("/login");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/tournaments");
    }
  }, [status, hydrated, segments, router]);

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
