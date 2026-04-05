import { useAppStore, type TournamentAccessMode } from "@/stores/app-store";

export function resolveTournamentAccessMode(
  accessMap: Record<string, TournamentAccessMode>,
  tournamentId?: string | null,
) {
  if (!tournamentId) {
    return "owner" as const;
  }

  return accessMap[tournamentId] ?? "owner";
}

export function useTournamentAccessMode(tournamentId?: string | null) {
  return useAppStore((state) => resolveTournamentAccessMode(state.tournamentAccess, tournamentId));
}

export function canEditTournament(accessMode: TournamentAccessMode) {
  return accessMode !== "viewer";
}

export function isTournamentAccessLocked(accessMode: TournamentAccessMode) {
  return accessMode === "editor" || accessMode === "viewer";
}
