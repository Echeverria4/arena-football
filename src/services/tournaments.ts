import { normalizeCampeonato } from "@/lib/season-tournaments";
import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { useTournamentStore } from "@/stores/tournament-store";
import type { Tournament, TournamentFormat, TournamentStatus } from "@/types/tournament";

export interface ActiveVideoTournament {
  id: string;
  name: string;
  createdAt: string;
  status: "active";
}

type TournamentRow = {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  rules?: string | null;
  creator_id: string;
  created_at?: string | null;
  start_date?: string | null;
  allow_videos: boolean;
  allow_goal_award: boolean;
  cover_url?: string | null;
};

// Legacy mock data helpers - for when Supabase is not configured
function mapTournamentRow(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    format: row.format,
    status: row.status,
    rules: row.rules ?? "Configurado no wizard do campeonato.",
    creatorId: row.creator_id,
    createdAt: row.created_at ?? new Date().toISOString(),
    startDate: row.start_date ?? row.created_at ?? new Date().toISOString(),
    allowVideos: row.allow_videos,
    allowGoalAward: row.allow_goal_award,
    coverUrl: row.cover_url ?? null,
  };
}

function buildMockTournament(overrides: Partial<Tournament> & Pick<Tournament, "name">): Tournament {
  return {
    id: overrides.id ?? `tournament-${Date.now()}`,
    name: overrides.name,
    format: overrides.format ?? "league",
    status: overrides.status ?? "in_progress",
    rules: overrides.rules ?? "Configurado no wizard do campeonato.",
    creatorId: overrides.creatorId ?? "user-organizer",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    startDate: overrides.startDate ?? new Date().toISOString(),
    allowVideos: overrides.allowVideos ?? true,
    allowGoalAward: overrides.allowGoalAward ?? true,
    coverUrl: overrides.coverUrl ?? null,
  };
}

export async function listTournaments(): Promise<Tournament[]> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const campeonatos = useTournamentStore.getState().campeonatos;

    if (!campeonatos.length) {
      return [];
    }

    return campeonatos.map((campeonato): Tournament =>
      buildMockTournament({
        id: campeonato.id,
        name: campeonato.nome,
        format: "league",
        status: campeonato.status === "finalizado" ? "finished" : "in_progress",
        creatorId: "user-organizer",
        createdAt: campeonato.criadoEm,
        startDate: campeonato.inicioEm ?? campeonato.criadoEm,
      }),
    );
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, format, status, rules, creator_id, created_at, start_date, allow_videos, allow_goal_award, cover_url")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapTournamentRow(row as TournamentRow));
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const campeonato = useTournamentStore.getState().campeonatos.find((item) => item.id === id);

    if (!campeonato) {
      return null;
    }

    return buildMockTournament({
      id: campeonato.id,
      name: campeonato.nome,
      format: "league",
      status: campeonato.status === "finalizado" ? "finished" : "in_progress",
      creatorId: "user-organizer",
      createdAt: campeonato.criadoEm,
      startDate: campeonato.inicioEm ?? campeonato.criadoEm,
    });
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, format, status, rules, creator_id, created_at, start_date, allow_videos, allow_goal_award, cover_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapTournamentRow(data as TournamentRow) : null;
}

export interface CreateTournamentInput {
  name: string;
  format: TournamentFormat;
  creatorId: string;
  rules?: string;
  startDate?: string;
  allowVideos?: boolean;
  allowGoalAward?: boolean;
  coverUrl?: string;
}

export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  // Fallback to mock when Supabase is not configured
  if (!isSupabaseConfigured) {
    return buildMockTournament({
      name: input.name,
      format: input.format,
      creatorId: input.creatorId,
      rules: input.rules,
      startDate: input.startDate,
      allowVideos: input.allowVideos,
      allowGoalAward: input.allowGoalAward,
      coverUrl: input.coverUrl,
    });
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: input.name,
      format: input.format,
      creator_id: input.creatorId,
      rules: input.rules ?? null,
      start_date: input.startDate ?? null,
      allow_videos: input.allowVideos ?? false,
      allow_goal_award: input.allowGoalAward ?? false,
      cover_url: input.coverUrl ?? null,
    })
    .select("id, name, format, status, rules, creator_id, created_at, start_date, allow_videos, allow_goal_award, cover_url")
    .single();

  if (error) {
    throw error;
  }

  return mapTournamentRow(data as TournamentRow);
}

export async function listActiveTournamentsForVideos(): Promise<ActiveVideoTournament[]> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const tournaments = useTournamentStore
      .getState()
      .campeonatos.map((campeonato) => normalizeCampeonato(campeonato))
      .filter((campeonato) => campeonato.status === "ativo")
      .map((campeonato) => ({
        id: campeonato.id,
        name: campeonato.nome,
        createdAt: campeonato.inicioEm ?? campeonato.criadoEm,
        status: "active" as const,
      }))
      .sort((current, next) => Date.parse(next.createdAt) - Date.parse(current.createdAt));

    return tournaments;
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, created_at, start_date")
    .in("status", ["in_progress", "open"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.start_date ?? row.created_at ?? new Date().toISOString(),
    status: "active" as const,
  }));
}
