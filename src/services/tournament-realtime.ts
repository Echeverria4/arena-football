import { isSupabaseConfigured, supabase } from "@/services/supabase";

/**
 * Write-back: push a single match score update to Supabase. The local store
 * mutation already applied; this just keeps the relational row in sync so
 * other clients receive it via realtime.
 */
export async function pushMatchScore(args: {
  supabaseMatchId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: "pending" | "finished";
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from("matches")
    .update({
      home_goals: args.homeGoals,
      away_goals: args.awayGoals,
      status: args.status,
    })
    .eq("id", args.supabaseMatchId);

  if (error) {
    console.warn(
      "[tournament-realtime] pushMatchScore failed: " + JSON.stringify(error),
    );
  }
}

export type RemoteMatchChange = {
  supabaseMatchId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: "pending" | "finished";
};

type SubscriptionHandle = {
  unsubscribe: () => void;
};

/**
 * Subscribe to realtime changes for a Supabase-backed tournament. Currently
 * watches the `matches` table — score saves from any collaborator fire the
 * callback so the local store can update.
 */
export function subscribeToTournament(args: {
  supabaseTournamentId: string;
  onMatchChange: (change: RemoteMatchChange) => void;
}): SubscriptionHandle {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`tournament:${args.supabaseTournamentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "matches",
        filter: `tournament_id=eq.${args.supabaseTournamentId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as
          | {
              id: string;
              home_goals: number | null;
              away_goals: number | null;
              status: "pending" | "finished";
            }
          | undefined;
        if (!row?.id) return;

        args.onMatchChange({
          supabaseMatchId: String(row.id),
          homeGoals: row.home_goals,
          awayGoals: row.away_goals,
          status: row.status,
        });
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(
          "[tournament-realtime] subscribed to tournament " +
            args.supabaseTournamentId,
        );
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(
          "[tournament-realtime] channel error for tournament " +
            args.supabaseTournamentId +
            ": " +
            status,
        );
      }
    });

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}
