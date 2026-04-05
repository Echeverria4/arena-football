import { useTournamentStore } from "@/stores/tournament-store";

export async function listMatchesByTournament(tournamentId?: string) {
  const campeonatos = useTournamentStore.getState().campeonatos;
  const campeonato = tournamentId
    ? campeonatos.find((item) => item.id === tournamentId)
    : campeonatos[0];

  if (!campeonato) {
    return [];
  }

  return campeonato.rodadas.flat().map((jogo) => ({
    id: jogo.id,
    tournamentId: campeonato.id,
    round: jogo.rodada,
    homeParticipantId: jogo.mandanteId,
    awayParticipantId: jogo.visitanteId,
    homeGoals: jogo.placarMandante,
    awayGoals: jogo.placarVisitante,
    status: jogo.status === "finalizado" ? "finished" : "pending",
  }));
}

export async function getMatchById(id: string, tournamentId?: string) {
  const matches = await listMatchesByTournament(tournamentId);
  return matches.find((match) => match.id === id) ?? null;
}

export async function submitMatchResult(
  tournamentId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
) {
  useTournamentStore
    .getState()
    .salvarPlacarJogo(tournamentId, matchId, homeGoals, awayGoals);

  return true;
}
