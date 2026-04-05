import { useTournamentStore } from "@/stores/tournament-store";

export async function getStandingsByTournament(tournamentId?: string) {
  const campeonatos = useTournamentStore.getState().campeonatos;
  const campeonato = tournamentId
    ? campeonatos.find((item) => item.id === tournamentId)
    : campeonatos[0];

  if (!campeonato) {
    return [];
  }

  return campeonato.classificacao;
}
