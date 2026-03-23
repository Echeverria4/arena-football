import { sampleTournament } from "@/lib/constants";

export async function listTournaments() {
  return [sampleTournament];
}

export async function getTournamentById(id: string) {
  return { ...sampleTournament, id };
}

export async function createTournament() {
  return sampleTournament;
}
