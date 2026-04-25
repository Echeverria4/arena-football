import { useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { subscribeToTournament } from "@/services/tournament-realtime";
import { useTournamentStore } from "@/stores/tournament-store";

const POLL_INTERVAL_MS = 5000;

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

/**
 * Keeps the local Campeonato in sync with Supabase for tournaments that have
 * been pushed (campeonato.supabaseId is set).
 *
 * Three layers of sync, redundant on purpose because mobile browsers
 * frequently kill long-lived WebSocket connections when the tab/screen
 * loses focus:
 *
 * 1. Realtime subscription (postgres_changes on `matches`) — pushes updates
 *    instantly when the channel is alive.
 *
 * 2. Re-fetch on `visibilitychange` — when the user returns to the tab we
 *    assume any number of updates may have been missed and pull a fresh
 *    snapshot once.
 *
 * 3. Periodic polling (every 15s while visible) — last-resort fallback when
 *    the WebSocket is silently dead (cellular networks, aggressive battery
 *    savers). Cheap idempotent UPDATEs into the store, no UI flicker.
 */
export function useTournamentRealtimeSync(args: {
  campeonatoId: string | undefined;
  supabaseTournamentId: string | undefined;
}): { status: SyncStatus; lastSyncedAt: number | null; lastError: string | null } {
  const aplicarPlacarRemoto = useTournamentStore(
    (state) => state.aplicarPlacarRemoto,
  );
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !args.supabaseTournamentId ||
      !args.campeonatoId
    ) {
      setStatus("idle");
      return;
    }

    const supabaseTournamentId = args.supabaseTournamentId;
    let cancelled = false;
    setStatus("syncing");

    async function reconcile(reason: string) {
      const fetchPromise = supabase
        .from("matches")
        .select("id, home_goals, away_goals, status")
        .eq("tournament_id", supabaseTournamentId);

      const result = await Promise.race([
        fetchPromise,
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: { message: "timeout" } }),
            5000,
          ),
        ),
      ]);

      if (cancelled) return;

      const { data, error } = result;
      if (error) {
        const errMsg = JSON.stringify(error);
        console.warn(
          "[useTournamentRealtimeSync] reconcile (" + reason + ") failed: " + errMsg,
        );
        if (!cancelled) {
          setStatus("error");
          setLastError(errMsg);
        }
        return;
      }

      for (const row of data ?? []) {
        if (!row?.id) continue;
        aplicarPlacarRemoto(
          supabaseTournamentId,
          String(row.id),
          row.home_goals as number | null,
          row.away_goals as number | null,
          row.status === "finished",
        );
      }
      if (!cancelled) {
        setStatus("synced");
        setLastSyncedAt(Date.now());
        setLastError(null);
      }
    }

    // Initial reconciliation on mount.
    void reconcile("initial");

    // Realtime subscription — primary delivery mechanism.
    const handle = subscribeToTournament({
      supabaseTournamentId,
      onMatchChange: (change) => {
        aplicarPlacarRemoto(
          supabaseTournamentId,
          change.supabaseMatchId,
          change.homeGoals,
          change.awayGoals,
          change.status === "finished",
        );
      },
    });

    // Fallback 1: re-sync when the tab becomes visible (mobile browsers
    // frequently kill the WebSocket when the user navigates away).
    function handleVisibilityChange() {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        void reconcile("visibility");
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Fallback 2: periodic poll while the tab is visible. Cheap and
    // idempotent — aplicarPlacarRemoto only touches state when something
    // actually changed.
    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void reconcile("poll");
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      handle.unsubscribe();
      clearInterval(pollTimer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [args.campeonatoId, args.supabaseTournamentId, aplicarPlacarRemoto]);

  return { status, lastSyncedAt, lastError };
}
