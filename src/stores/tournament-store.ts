import { create } from "zustand";

import { sampleTournament } from "@/lib/constants";
import type { Tournament } from "@/types/tournament";

interface TournamentState {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  setSelectedTournament: (tournament: Tournament | null) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  tournaments: [sampleTournament],
  selectedTournament: sampleTournament,
  setSelectedTournament: (tournament) => set({ selectedTournament: tournament }),
}));
