import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { supabase } from "@/services/supabase";
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

function AuthSessionSync() {
  useEffect(() => {
    // Initial hydration — restore any persisted Supabase session into the store.
    void useAuthStore.getState().hydrateSession();

    // Keep the store in sync with Supabase auth events (OAuth return, token refresh, sign-out in another tab).
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return; // already handled by hydrateSession above
      if (event === "SIGNED_OUT" || !session) {
        useAuthStore.getState().clearSession();
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        void useAuthStore.getState().hydrateSession();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, width: "100%", minHeight: 0 }}>
      <AuthSessionSync />
      <TournamentDeadlineAutoSync />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050A11", flex: 1, width: "100%", maxWidth: "100vw" as never },
          animation: "fade",
        }}
      />
    </GestureHandlerRootView>
  );
}
