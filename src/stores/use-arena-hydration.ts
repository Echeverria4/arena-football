import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useVideoStore } from "@/stores/video-store";

export function useArenaDataHydrated() {
  const appHydrated = useAppStore((state) => state.hydrated);
  const tournamentHydrated = useTournamentStore((state) => state.hydrated);
  const videoHydrated = useVideoStore((state) => state.hydrated);

  return appHydrated && tournamentHydrated && videoHydrated;
}

export function useTournamentDataHydrated() {
  const tournamentHydrated = useTournamentStore((state) => state.hydrated);
  const videoHydrated = useVideoStore((state) => state.hydrated);

  return tournamentHydrated && videoHydrated;
}

export function useMatchDataHydrated() {
  const authHydrated = useAuthStore((state) => state.hydrated);
  const tournamentHydrated = useTournamentStore((state) => state.hydrated);

  return authHydrated && tournamentHydrated;
}
