import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { pushCampeonatoToSupabase } from "@/services/tournament-collab";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";

export type TournamentShareAccess = "editor" | "viewer";

type TournamentSharePayload = {
  version: 1;
  campeonato: any;
  videos: any[];
};

type TournamentShareRow = {
  share_key: string;
  access: TournamentShareAccess;
  tournament_name: string;
  tournament_id: string;
  expires_at?: string | null;
  payload: TournamentSharePayload;
};

function isTournamentFinished(campeonato: any) {
  return String(campeonato?.status ?? "").toLowerCase() === "finalizado";
}

function normalizeBaseUrl(url: string) {
  return String(url).trim().replace(/\/+$/, "");
}

function getPublicAppUrl() {
  const envUrl =
    typeof process !== "undefined" && process.env
      ? process.env.EXPO_PUBLIC_APP_URL
      : undefined;

  if (!envUrl || !String(envUrl).trim()) {
    throw new Error(
      "EXPO_PUBLIC_APP_URL não definida. Configure a URL pública do app no .env."
    );
  }

  return normalizeBaseUrl(String(envUrl));
}

function createTournamentSharePayload(campeonato: any, videos: any[]) {
  return {
    version: 1,
    campeonato,
    videos: Array.isArray(videos) ? videos : [],
  } satisfies TournamentSharePayload;
}

function parseSerializedTournamentSharePayload(serialized: string) {
  try {
    const parsed = JSON.parse(serialized) as TournamentSharePayload;

    if (!parsed || parsed.version !== 1 || !parsed.campeonato) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function serializeTournamentSharePayload(campeonato: any, videos: any[]) {
  return encodeURIComponent(
    JSON.stringify(createTournamentSharePayload(campeonato, videos)),
  );
}

export function serializeCompressedTournamentSharePayload(
  campeonato: any,
  videos: any[],
) {
  return compressToEncodedURIComponent(
    JSON.stringify(createTournamentSharePayload(campeonato, videos)),
  );
}

function buildInlineTournamentShareLink(args: {
  access: TournamentShareAccess;
  campeonato: any;
  videos: any[];
}) {
  const data = serializeCompressedTournamentSharePayload(
    args.campeonato,
    args.videos,
  );

  return `${getPublicAppUrl()}/tournament/share?access=${args.access}&data=${data}`;
}

function createShareKey() {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  let result = "";

  for (let index = 0; index < 8; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "a";
  }

  return result;
}

export function parseTournamentSharePayload(
  rawPayload?: string | string[] | null,
  rawCompressedPayload?: string | string[] | null,
) {
  const compressedPayload = Array.isArray(rawCompressedPayload)
    ? rawCompressedPayload[0]
    : rawCompressedPayload;
  const serialized = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;

  if (compressedPayload) {
    const decompressedPayload = decompressFromEncodedURIComponent(compressedPayload);

    if (decompressedPayload) {
      const parsedCompressedPayload =
        parseSerializedTournamentSharePayload(decompressedPayload);

      if (parsedCompressedPayload) {
        return parsedCompressedPayload;
      }
    }
  }

  if (!serialized) {
    return null;
  }

  return parseSerializedTournamentSharePayload(decodeURIComponent(serialized));
}

type ExistingShareRow = {
  id: string;
  share_key: string;
  expires_at: string | null;
};

async function fetchExistingTournamentShares(args: {
  tournamentId: string;
  access: TournamentShareAccess;
}): Promise<ExistingShareRow[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from("tournament_shares")
    .select("id, share_key, expires_at")
    .eq("tournament_id", args.tournamentId)
    .eq("access", args.access)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.warn(
      "[tournament-sharing] fetchExistingTournamentShares error:",
      JSON.stringify(error),
    );
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data as ExistingShareRow[];
}

function pickActiveShare(rows: ExistingShareRow[]): ExistingShareRow | null {
  const now = Date.now();
  return (
    rows.find(
      (row) => !row.expires_at || Date.parse(String(row.expires_at)) > now,
    ) ?? null
  );
}

/**
 * Ensures the local campeonato is replicated into the Supabase relational
 * tables (tournaments/participants/matches/standings) so that editors who
 * claim the share link can read/write via RLS + realtime.
 *
 * Returns the Supabase tournament UUID, or null on any failure (caller
 * falls back to the inline snapshot link).
 */
async function ensureCampeonatoPushedToSupabase(campeonato: any): Promise<{
  tournamentIdForShare: string;
  campeonatoSynced: any;
} | null> {
  if (!isSupabaseConfigured) return null;

  const authUser = useAuthStore.getState().user;
  if (!authUser?.id) {
    console.warn("[tournament-sharing] cannot push to Supabase without authenticated user");
    return null;
  }

  try {
    const result = await pushCampeonatoToSupabase(campeonato, authUser.id);
    // Persist the freshly-assigned supabaseIds back to the local store so
    // subsequent pushes/edits reuse them.
    useTournamentStore.getState().atualizarCampeonato(campeonato.id, {
      supabaseId: result.campeonato.supabaseId,
      participantes: result.campeonato.participantes,
      rodadas: result.campeonato.rodadas,
    });
    return {
      tournamentIdForShare: result.tournamentId,
      campeonatoSynced: result.campeonato,
    };
  } catch (error) {
    const err = error as { message?: string; code?: string; details?: string; hint?: string };
    console.error(
      "[tournament-sharing] pushCampeonatoToSupabase failed: " +
        JSON.stringify({
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
        }),
    );
    return null;
  }
}

async function persistTournamentShare(args: {
  access: TournamentShareAccess;
  campeonato: any;
  videos: any[];
}) {
  if (!isSupabaseConfigured) {
    console.warn("[tournament-sharing] Supabase NAO configurado — fallback inline");
    return null;
  }

  const campeonatoId = String(args?.campeonato?.id ?? "");
  const campeonatoNome = String(args?.campeonato?.nome ?? "Campeonato");

  if (!campeonatoId) {
    console.warn("[tournament-sharing] campeonato.id vazio — fallback inline");
    return null;
  }

  if (isTournamentFinished(args.campeonato)) {
    console.warn("[tournament-sharing] campeonato finalizado — fallback inline");
    return null;
  }

  console.log("[tournament-sharing] persistTournamentShare start", {
    access: args.access,
    campeonatoId,
    status: args.campeonato?.status,
  });

  // Best-effort push to Supabase so editors that claim the share key get full
  // RLS access to the relational tables. If push fails (no auth, network, RLS
  // etc.) we still persist the share as snapshot-only with the local id —
  // share link fica curto, editores só ficam sem o canal relacional/realtime
  // ate conseguirmos um push bem sucedido.
  const pushResult = await ensureCampeonatoPushedToSupabase(args.campeonato);
  const tournamentIdForShare = pushResult?.tournamentIdForShare ?? campeonatoId;
  const campeonatoForPayload = pushResult?.campeonatoSynced ?? args.campeonato;

  if (!pushResult) {
    console.info(
      "[tournament-sharing] push falhou; salvando share como snapshot-only com tournament_id=" +
        tournamentIdForShare,
    );
  }

  const existingRows = await fetchExistingTournamentShares({
    tournamentId: tournamentIdForShare,
    access: args.access,
  });

  const activeRow = pickActiveShare(existingRows);

  const payload = createTournamentSharePayload(campeonatoForPayload, args.videos);

  // If there's already an active share, refresh its payload (so the link
  // returns up-to-date snapshot data) and return its key.
  if (activeRow) {
    const refresh = await supabase
      .from("tournament_shares")
      .update({ payload, tournament_name: campeonatoNome })
      .eq("id", activeRow.id);

    if (refresh.error) {
      console.warn(
        "[tournament-sharing] refresh active share failed: " +
          JSON.stringify(refresh.error),
      );
    }

    return activeRow.share_key;
  }

  // No active share but maybe an expired one — revive it with a fresh key
  // and clear expires_at instead of inserting (the partial unique index on
  // active rows would still allow this insert, but reusing avoids cluttering
  // the table with stale rows).
  const expiredRow = existingRows[0];
  if (expiredRow) {
    const newShareKey = createShareKey();
    const revive = await supabase
      .from("tournament_shares")
      .update({
        share_key: newShareKey,
        expires_at: null,
        payload,
        tournament_name: campeonatoNome,
      })
      .eq("id", expiredRow.id)
      .select("share_key")
      .single();

    if (!revive.error && revive.data?.share_key) {
      console.log(
        "[tournament-sharing] share_key revivido com sucesso:",
        revive.data.share_key,
      );
      return String(revive.data.share_key);
    }

    console.warn(
      "[tournament-sharing] revive expired share failed: " +
        JSON.stringify(revive.error),
    );
    // Fall through to insert path below.
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shareKey = createShareKey();

    const { data: inserted, error } = await supabase
      .from("tournament_shares")
      .insert({
        share_key: shareKey,
        access: args.access,
        tournament_id: tournamentIdForShare,
        tournament_name: campeonatoNome,
        payload,
      })
      .select("share_key")
      .single();

    if (!error && inserted?.share_key === shareKey) {
      console.log("[tournament-sharing] share_key criado com sucesso:", shareKey);
      return shareKey;
    }

    const errorCode = (error as any)?.code;

    // 23505 = expected race when multiple share calls fire in parallel; the
    // partial unique index does its job and the retry below picks up the
    // already-inserted row. Log at debug level only.
    if (errorCode === "23505") {
      console.debug(
        "[tournament-sharing] insert race (23505) — usando share existente: " +
          JSON.stringify({ attempt, tournamentIdForShare, access: args.access }),
      );
    } else {
      console.error(
        "[tournament-sharing] insert em tournament_shares falhou: " +
          JSON.stringify({
            attempt,
            shareKey,
            tournamentIdForShare,
            access: args.access,
            errorCode,
            errorMessage: (error as any)?.message,
            errorDetails: (error as any)?.details,
            errorHint: (error as any)?.hint,
          }),
      );
    }

    if (errorCode === "23505") {
      const retryRows = await fetchExistingTournamentShares({
        tournamentId: tournamentIdForShare,
        access: args.access,
      });
      const retryActive = pickActiveShare(retryRows);
      if (retryActive) {
        return retryActive.share_key;
      }
      continue;
    }

    return null;
  }

  console.warn("[tournament-sharing] insert falhou apos 3 tentativas — fallback inline");
  return null;
}

export async function fetchTournamentShareByKey(
  shareKey?: string | string[] | null
) {
  const safeKey = Array.isArray(shareKey) ? shareKey[0] : shareKey;

  if (!safeKey || !isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from("tournament_shares")
    .select("share_key, access, tournament_name, tournament_id, expires_at, payload")
    .eq("share_key", safeKey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as TournamentShareRow;

  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    return null;
  }

  if (!row.payload || row.payload.version !== 1 || !row.payload.campeonato) {
    return null;
  }

  if (isTournamentFinished(row.payload.campeonato)) {
    return null;
  }

  return {
    access: row.access,
    campeonato: row.payload.campeonato,
    videos: Array.isArray(row.payload.videos) ? row.payload.videos : [],
    tournamentName: row.tournament_name,
  };
}

export async function buildTournamentShareLink(args: {
  access: TournamentShareAccess;
  campeonato: any;
  videos: any[];
}) {
  if (isTournamentFinished(args.campeonato)) {
    return null;
  }

  const shareKey = await persistTournamentShare(args);

  if (shareKey) {
    return `${getPublicAppUrl()}/s/${shareKey}`;
  }

  return buildInlineTournamentShareLink(args);
}

export async function expireTournamentSharesByTournamentId(
  tournamentId?: string | string[] | null,
  expiresAt?: string,
) {
  if (!isSupabaseConfigured) {
    return;
  }

  const candidates = (Array.isArray(tournamentId) ? tournamentId : [tournamentId])
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);

  if (candidates.length === 0) {
    return;
  }

  await supabase
    .from("tournament_shares")
    .update({ expires_at: expiresAt ?? new Date().toISOString() })
    .in("tournament_id", candidates)
    .is("expires_at", null);
}
