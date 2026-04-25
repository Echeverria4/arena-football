import { isSupabaseConfigured, supabase } from "@/services/supabase";
import type {
  Campeonato,
  Jogo,
  Participante,
  TournamentFormat,
} from "@/types/tournament";

/**
 * Push + claim helpers for shared tournament collaboration.
 *
 * - `pushCampeonatoToSupabase` replicates the local Campeonato into the
 *   relational tables (`tournaments`, `tournament_participants`, `matches`,
 *   `standings`), assigning Supabase UUIDs where missing. Must be called
 *   while the moderator is authenticated — RLS requires it.
 *
 * - `claimTournamentShare` calls the `claim_tournament_share` RPC so an
 *   authenticated editor/viewer self-inserts into `tournament_collaborators`,
 *   unlocking RLS access to the tournament data.
 */

function generateUuid(): string {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (RN default).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

function mapStatusToSupabase(status: Campeonato["status"]): "in_progress" | "finished" {
  return status === "finalizado" ? "finished" : "in_progress";
}

function mapMatchStatusToSupabase(status: Jogo["status"]): "pending" | "finished" {
  return status === "finalizado" ? "finished" : "pending";
}

function normalizeFormat(format: TournamentFormat | undefined): TournamentFormat {
  return format ?? "league";
}

function resolveGroupName(participante: Participante): string | null {
  return participante.grupo?.trim() ? participante.grupo : null;
}

export interface PushCampeonatoResult {
  tournamentId: string;
  campeonato: Campeonato;
}

/**
 * Upserts a local Campeonato (plus participants/matches/standings) into
 * Supabase. Assigns `supabaseId` to the Campeonato and nested entities where
 * missing. Returns the updated Campeonato — the caller should persist it back
 * into the local store so the generated UUIDs are kept for next pushes.
 */
export async function pushCampeonatoToSupabase(
  campeonato: Campeonato,
  creatorId: string,
): Promise<PushCampeonatoResult> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao esta configurado.");
  }

  if (!creatorId) {
    throw new Error("creatorId e obrigatorio para vincular o campeonato.");
  }

  // RLS exige que creator_id em public.tournaments seja igual a
  // public.current_profile_id() (que olha public.users.auth_user_id =
  // auth.uid()). Validamos primeiro pra dar erro claro caso o profile do
  // moderador nao esteja ligado a auth.uid() correta.
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[pushCampeonatoToSupabase] supabase.auth.getUser falhou:", authError);
    throw authError;
  }
  if (!authData.user) {
    throw new Error("Sem sessao Supabase ativa — faca login antes de gerar share.");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("[pushCampeonatoToSupabase] lookup public.users falhou:", profileError);
    throw profileError;
  }
  if (!profileRow?.id) {
    throw new Error(
      "Seu auth user nao tem perfil em public.users — o cadastro provavelmente nao concluiu o upsertProfile.",
    );
  }

  // O creatorId passado pode estar desatualizado (vindo do authStore antes
  // de hidratar). Sempre usamos o profile.id confirmado da Supabase.
  const resolvedCreatorId = profileRow.id;
  if (resolvedCreatorId !== creatorId) {
    console.warn(
      "[pushCampeonatoToSupabase] creatorId arg !== profile.id real — usando profile.id:",
      { argCreatorId: creatorId, resolvedCreatorId },
    );
  }

  // 1. Tournament row
  const tournamentId = isValidUuid(campeonato.supabaseId)
    ? campeonato.supabaseId
    : generateUuid();

  const tournamentRow = {
    id: tournamentId,
    name: campeonato.nome,
    format: normalizeFormat(campeonato.formato),
    status: mapStatusToSupabase(campeonato.status),
    rules: campeonato.regras ?? null,
    creator_id: resolvedCreatorId,
    start_date: campeonato.inicioEm?.slice(0, 10) ?? null,
    allow_videos: Boolean(campeonato.allowVideos),
    allow_goal_award: Boolean(campeonato.allowGoalAward),
  };

  const tournamentUpsert = await supabase
    .from("tournaments")
    .upsert(tournamentRow, { onConflict: "id" })
    .select("id")
    .single();

  if (tournamentUpsert.error) {
    console.error(
      "[pushCampeonatoToSupabase] tournament upsert failed: " +
        JSON.stringify({
          message: tournamentUpsert.error.message,
          code: (tournamentUpsert.error as { code?: string }).code,
          details: (tournamentUpsert.error as { details?: string }).details,
          hint: (tournamentUpsert.error as { hint?: string }).hint,
          tournamentId,
          resolvedCreatorId,
          authUserId: authData.user.id,
        }),
    );
    throw tournamentUpsert.error;
  }

  // 2. Participants
  const participantesAtualizados: Participante[] = campeonato.participantes.map((p) => ({
    ...p,
    supabaseId: isValidUuid(p.supabaseId) ? p.supabaseId : generateUuid(),
  }));

  const participantRows = participantesAtualizados.map((p) => ({
    id: p.supabaseId!,
    tournament_id: tournamentId,
    user_id: null, // participantes locais nao tem conta vinculada
    team_name: p.time,
    group_name: resolveGroupName(p),
    is_organizer: false,
    display_name: p.nome,
    phone: p.whatsapp ?? null,
    team_badge_url: p.timeImagem ?? null,
  }));

  if (participantRows.length > 0) {
    const participantUpsert = await supabase
      .from("tournament_participants")
      .upsert(participantRows, { onConflict: "id" });

    if (participantUpsert.error) {
      console.error("[pushCampeonatoToSupabase] participants upsert failed:", participantUpsert.error);
      throw participantUpsert.error;
    }
  }

  // Remove participants in Supabase that aren't in the local campeonato anymore
  const keepIds = participantesAtualizados
    .map((p) => p.supabaseId)
    .filter((id): id is string => Boolean(id));
  if (keepIds.length > 0) {
    const deleteResult = await supabase
      .from("tournament_participants")
      .delete()
      .eq("tournament_id", tournamentId)
      .not("id", "in", `(${keepIds.join(",")})`);
    if (deleteResult.error) {
      console.warn("[pushCampeonatoToSupabase] participants cleanup failed:", deleteResult.error);
    }
  }

  // Build a local → Supabase participant ID map for matches
  const participantIdMap = new Map<string, string>();
  for (const p of participantesAtualizados) {
    if (p.supabaseId) participantIdMap.set(p.id, p.supabaseId);
  }

  // 3. Matches (flatten rodadas)
  const rodadasAtualizadas: Jogo[][] = campeonato.rodadas.map((rodada) =>
    rodada.map((jogo) => ({
      ...jogo,
      supabaseId: isValidUuid(jogo.supabaseId) ? jogo.supabaseId : generateUuid(),
    })),
  );

  const matchRows: Record<string, unknown>[] = [];
  for (let rodadaIndex = 0; rodadaIndex < rodadasAtualizadas.length; rodadaIndex += 1) {
    const rodada = rodadasAtualizadas[rodadaIndex] ?? [];
    for (const jogo of rodada) {
      const homeId = participantIdMap.get(jogo.mandanteId);
      const awayId = participantIdMap.get(jogo.visitanteId);
      if (!homeId || !awayId) {
        console.warn(
          `[pushCampeonatoToSupabase] skipping match ${jogo.id} — missing participant mapping`,
        );
        continue;
      }

      matchRows.push({
        id: jogo.supabaseId,
        tournament_id: tournamentId,
        round: jogo.rodada,
        phase: "regular",
        home_participant_id: homeId,
        away_participant_id: awayId,
        home_goals: jogo.placarMandante,
        away_goals: jogo.placarVisitante,
        status: mapMatchStatusToSupabase(jogo.status),
      });
    }
  }

  if (matchRows.length > 0) {
    const matchUpsert = await supabase
      .from("matches")
      .upsert(matchRows, { onConflict: "id" });

    if (matchUpsert.error) {
      console.error("[pushCampeonatoToSupabase] matches upsert failed:", matchUpsert.error);
      throw matchUpsert.error;
    }
  }

  // 4. Standings
  const standingRows = campeonato.classificacao
    .map((c) => {
      const participantId = participantIdMap.get(c.participanteId);
      if (!participantId) return null;
      return {
        tournament_id: tournamentId,
        participant_id: participantId,
        played: c.jogos,
        points: c.pontos,
        wins: c.vitorias,
        draws: c.empates,
        losses: c.derrotas,
        goals_for: c.golsPro,
        goals_against: c.golsContra,
        goal_difference: c.saldo,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (standingRows.length > 0) {
    const standingsUpsert = await supabase
      .from("standings")
      .upsert(standingRows, { onConflict: "tournament_id,participant_id" });

    if (standingsUpsert.error) {
      console.error("[pushCampeonatoToSupabase] standings upsert failed:", standingsUpsert.error);
      throw standingsUpsert.error;
    }
  }

  const updatedCampeonato: Campeonato = {
    ...campeonato,
    supabaseId: tournamentId,
    participantes: participantesAtualizados,
    rodadas: rodadasAtualizadas,
  };

  return {
    tournamentId,
    campeonato: updatedCampeonato,
  };
}

export interface ClaimedShare {
  tournamentId: string;
  access: "editor" | "viewer";
}

/**
 * Calls the `claim_tournament_share` RPC so the authenticated user is
 * inserted in `tournament_collaborators` with the access level defined in
 * the share link. Returns the tournament UUID and granted access.
 *
 * Throws if the user is not authenticated or the share key is invalid.
 */
export async function claimTournamentShare(shareKey: string): Promise<ClaimedShare> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase nao esta configurado.");
  }

  const { data, error } = await supabase.rpc("claim_tournament_share", {
    p_share_key: shareKey,
  });

  if (error) {
    console.error("[claimTournamentShare] RPC failed:", error);
    throw error;
  }

  if (!data) {
    throw new Error("RPC retornou vazio.");
  }

  // A RPC devolve uma row — quando Supabase retorna um objeto unico, vem como
  // o proprio objeto; quando lista, vem array. Tratamos os dois casos.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.tournament_id || !row?.access) {
    throw new Error("Resposta do RPC nao contem tournament_id ou access.");
  }

  return {
    tournamentId: String(row.tournament_id),
    access: row.access as "editor" | "viewer",
  };
}
