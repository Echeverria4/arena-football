import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { useTournamentStore } from "@/stores/tournament-store";
import type { StandingEntry } from "@/types/tournament";

type StandingRow = {
  participant_id: string;
  played: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
};

function mapStandingRow(row: StandingRow): StandingEntry {
  return {
    participantId: row.participant_id,
    played: row.played,
    points: row.points,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    goalDifference: row.goal_difference,
  };
}

function buildMockStanding(participantId: string): StandingEntry {
  return {
    participantId,
    played: 0,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  };
}

export async function getStandingsByTournament(tournamentId?: string): Promise<StandingEntry[]> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const campeonatos = useTournamentStore.getState().campeonatos;
    const campeonato = tournamentId
      ? campeonatos.find((item) => item.id === tournamentId)
      : campeonatos[0];

    if (!campeonato) {
      return [];
    }

    return campeonato.classificacao.map((item) => ({
      participantId: item.participanteId,
      played: item.jogos,
      points: item.pontos,
      wins: item.vitorias,
      draws: item.empates,
      losses: item.derrotas,
      goalsFor: item.golsPro,
      goalsAgainst: item.golsContra,
      goalDifference: item.saldo,
    }));
  }

  if (!tournamentId) {
    return [];
  }

  const { data, error } = await supabase
    .from("standings")
    .select("participant_id, played, points, wins, draws, losses, goals_for, goals_against, goal_difference")
    .eq("tournament_id", tournamentId)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapStandingRow(row as StandingRow));
}
