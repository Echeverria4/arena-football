import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { useTournamentStore } from "@/stores/tournament-store";
import type { Match, MatchStatus } from "@/types/match";

type MatchRow = {
  id: string;
  tournament_id: string;
  round: number;
  phase: string;
  home_participant_id: string;
  away_participant_id: string;
  home_goals?: number | null;
  away_goals?: number | null;
  status: MatchStatus;
  deadline_at?: string | null;
  created_at?: string | null;
};

function mapMatchRow(row: MatchRow): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    round: row.round,
    phase: row.phase,
    homeParticipantId: row.home_participant_id,
    awayParticipantId: row.away_participant_id,
    homeGoals: row.home_goals ?? undefined,
    awayGoals: row.away_goals ?? undefined,
    status: row.status,
    deadlineAt: row.deadline_at ?? undefined,
  };
}

function buildMockMatch(overrides: Partial<Match> & Pick<Match, "tournamentId" | "homeParticipantId" | "awayParticipantId">): Match {
  return {
    id: overrides.id ?? `match-${Date.now()}`,
    tournamentId: overrides.tournamentId,
    round: overrides.round ?? 1,
    phase: overrides.phase ?? "group",
    homeParticipantId: overrides.homeParticipantId,
    awayParticipantId: overrides.awayParticipantId,
    homeGoals: overrides.homeGoals,
    awayGoals: overrides.awayGoals,
    status: overrides.status ?? "pending",
    deadlineAt: overrides.deadlineAt,
  };
}

export async function listMatchesByTournament(tournamentId?: string): Promise<Match[]> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const campeonatos = useTournamentStore.getState().campeonatos;
    const campeonato = tournamentId
      ? campeonatos.find((item) => item.id === tournamentId)
      : campeonatos[0];

    if (!campeonato) {
      return [];
    }

    return campeonato.rodadas.flat().map((jogo) =>
      buildMockMatch({
        id: jogo.id,
        tournamentId: campeonato.id,
        round: jogo.rodada,
        homeParticipantId: jogo.mandanteId,
        awayParticipantId: jogo.visitanteId,
        homeGoals: jogo.placarMandante,
        awayGoals: jogo.placarVisitante,
        status: jogo.status === "finalizado" ? "finished" : "pending",
      }),
    );
  }

  if (!tournamentId) {
    return [];
  }

  const { data, error } = await supabase
    .from("matches")
    .select("id, tournament_id, round, phase, home_participant_id, away_participant_id, home_goals, away_goals, status, deadline_at, created_at")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapMatchRow(row as MatchRow));
}

export async function getMatchById(id: string, tournamentId?: string): Promise<Match | null> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const matches = await listMatchesByTournament(tournamentId);
    return matches.find((match) => match.id === id) ?? null;
  }

  const query = supabase.from("matches").select("id, tournament_id, round, phase, home_participant_id, away_participant_id, home_goals, away_goals, status, deadline_at, created_at").eq("id", id);

  if (tournamentId) {
    query.eq("tournament_id", tournamentId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapMatchRow(data as MatchRow) : null;
}

export async function submitMatchResult(tournamentId: string, matchId: string, homeGoals: number, awayGoals: number): Promise<boolean> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    useTournamentStore.getState().salvarPlacarJogo(tournamentId, matchId, homeGoals, awayGoals);
    return true;
  }

  const { error } = await supabase
    .from("matches")
    .update({
      home_goals: homeGoals,
      away_goals: awayGoals,
      status: "finished",
    })
    .eq("id", matchId)
    .eq("tournament_id", tournamentId);

  if (error) {
    throw error;
  }

  return true;
}
