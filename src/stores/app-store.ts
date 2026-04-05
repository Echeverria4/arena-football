import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { persistStorage } from "@/stores/persist-storage";

export type TournamentAccessMode = "owner" | "editor" | "viewer";
export type VideoPanelAccessMode = "owner" | "moderator" | "viewer";

interface AppState {
  bootCompleted: boolean;
  currentTournamentId?: string;
  hydrated: boolean;
  tournamentAccess: Record<string, TournamentAccessMode>;
  videoPanelAccessMode: VideoPanelAccessMode;
  setHydrated: (value: boolean) => void;
  setBootCompleted: (value: boolean) => void;
  setCurrentTournamentId: (value?: string) => void;
  setTournamentAccess: (tournamentId: string, mode: TournamentAccessMode) => void;
  setVideoPanelAccessMode: (mode: VideoPanelAccessMode) => void;
  clearTournamentAccess: (tournamentId: string) => void;
  clearVideoPanelAccess: () => void;
  releaseSharedTournamentAccess: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      bootCompleted: false,
      currentTournamentId: undefined,
      hydrated: false,
      tournamentAccess: {},
      videoPanelAccessMode: "owner",
      setHydrated: (value) => set({ hydrated: value }),
      setBootCompleted: (value) => set({ bootCompleted: value }),
      setCurrentTournamentId: (value) => set({ currentTournamentId: value }),
      setTournamentAccess: (tournamentId, mode) =>
        set((state) => ({
          tournamentAccess: {
            ...state.tournamentAccess,
            [tournamentId]: mode,
          },
        })),
      setVideoPanelAccessMode: (mode) => set({ videoPanelAccessMode: mode }),
      clearTournamentAccess: (tournamentId) =>
        set((state) => {
          const nextAccess = { ...state.tournamentAccess };
          delete nextAccess[tournamentId];

          return {
            tournamentAccess: nextAccess,
          };
        }),
      clearVideoPanelAccess: () =>
        set({
          videoPanelAccessMode: "owner",
        }),
      releaseSharedTournamentAccess: () =>
        set((state) => {
          const nextAccess = Object.fromEntries(
            Object.entries(state.tournamentAccess).filter(([, mode]) => mode === "owner"),
          ) as Record<string, TournamentAccessMode>;
          const currentAccessMode = state.currentTournamentId
            ? state.tournamentAccess[state.currentTournamentId]
            : undefined;

          return {
            currentTournamentId:
              currentAccessMode && currentAccessMode !== "owner"
                ? undefined
                : state.currentTournamentId,
            tournamentAccess: nextAccess,
          };
        }),
    }),
    {
      name: "arena-app-store",
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        bootCompleted: state.bootCompleted,
        currentTournamentId: state.currentTournamentId,
        tournamentAccess: state.tournamentAccess,
        videoPanelAccessMode: state.videoPanelAccessMode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
