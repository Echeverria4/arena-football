import { useLocalSearchParams } from "expo-router";

import { SharedTournamentEntryScreen } from "@/components/tournament/SharedTournamentEntryScreen";

export default function TournamentShareScreen() {
  const params = useLocalSearchParams<{
    access?: string | string[];
    key?: string | string[];
    data?: string | string[];
    payload?: string | string[];
  }>();

  return (
    <SharedTournamentEntryScreen
      access={params.access}
      data={params.data}
      payload={params.payload}
      shareKey={params.key}
    />
  );
}
