import { create } from "zustand";

interface AppState {
  bootCompleted: boolean;
  currentTournamentId?: string;
  setBootCompleted: (value: boolean) => void;
  setCurrentTournamentId: (value?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  bootCompleted: false,
  currentTournamentId: "arena-2026-open",
  setBootCompleted: (value) => set({ bootCompleted: value }),
  setCurrentTournamentId: (value) => set({ currentTournamentId: value }),
}));
