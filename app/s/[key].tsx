import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

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
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!bootCompleted) {
      const key = Array.isArray(params.key) ? params.key[0] : params.key;
      router.replace({ pathname: "/boot", params: { redirect: `/s/${key}` } });
    }
  }, [hydrated, bootCompleted, params.key]);

  if (!bootCompleted) return null;

  return (
    <SharedTournamentEntryScreen
      access={params.access}
      data={params.data}
      payload={params.payload}
      shareKey={params.key}
    />
  );
}
