import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { useTournamentStore } from "@/stores/tournament-store";
import type { TournamentParticipant } from "@/types/tournament";

type ParticipantRow = {
  id: string;
  tournament_id: string;
  user_id: string;
  team_name: string;
  group_name: string | null;
  is_organizer: boolean;
  display_name: string | null;
  phone: string | null;
  team_badge_url: string | null;
  stadium_image_url: string | null;
};

function mapParticipantRow(row: ParticipantRow): TournamentParticipant {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id,
    teamName: row.team_name,
    groupName: row.group_name ?? null,
    isOrganizer: row.is_organizer,
    displayName: row.display_name ?? "",
    phone: row.phone ?? null,
    teamBadgeUrl: row.team_badge_url ?? null,
    stadiumImageUrl: row.stadium_image_url ?? null,
  };
}

export async function listParticipantsByTournament(tournamentId: string): Promise<TournamentParticipant[]> {
  if (!isSupabaseConfigured) {
    const campeonato = useTournamentStore
      .getState()
      .campeonatos.find((item) => item.id === tournamentId);

    if (!campeonato) {
      return [];
    }

    return campeonato.participantes.map((p) => ({
      id: p.id,
      tournamentId: campeonato.id,
      userId: "user-local",
      teamName: p.time,
      groupName: p.grupo ?? null,
      isOrganizer: false,
      displayName: p.nome,
      phone: p.whatsapp ?? null,
      teamBadgeUrl: null,
      stadiumImageUrl: null,
    }));
  }

  const { data, error } = await supabase
    .from("tournament_participants")
    .select(
      "id, tournament_id, user_id, team_name, group_name, is_organizer, display_name, phone, team_badge_url, stadium_image_url",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapParticipantRow(row as ParticipantRow));
}

export interface UpdateParticipantDisplayInput {
  displayName: string;
  phone?: string;
}

export async function updateParticipantDisplay(
  participantId: string,
  updates: UpdateParticipantDisplayInput,
): Promise<void> {
  if (!isSupabaseConfigured) {
    // Local store is updated directly by the caller (atualizarCampeonato).
    return;
  }

  const { error } = await supabase
    .from("tournament_participants")
    .update({
      display_name: updates.displayName,
      phone: updates.phone ?? null,
    })
    .eq("id", participantId);

  if (error) {
    throw error;
  }
}
