import { sampleMatches } from "@/lib/constants";

export async function listMatchesByTournament() {
  return sampleMatches;
}

export async function getMatchById(id: string) {
  return sampleMatches.find((match) => match.id === id) ?? sampleMatches[0];
}

export async function submitMatchResult() {
  return true;
}
