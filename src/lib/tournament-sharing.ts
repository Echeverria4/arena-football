import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { isSupabaseConfigured, supabase } from "@/services/supabase";

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

async function findExistingTournamentShare(args: {
  tournamentId: string;
  access: TournamentShareAccess;
}) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from("tournament_shares")
    .select("share_key")
    .eq("tournament_id", args.tournamentId)
    .eq("access", args.access)
    .is("expires_at", null)
    .maybeSingle();

  if (error || !data?.share_key) {
    return null;
  }

  return String(data.share_key);
}

async function persistTournamentShare(args: {
  access: TournamentShareAccess;
  campeonato: any;
  videos: any[];
}) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const campeonatoId = String(args?.campeonato?.id ?? "");
  const campeonatoNome = String(args?.campeonato?.nome ?? "Campeonato");

  if (!campeonatoId) {
    return null;
  }

  if (isTournamentFinished(args.campeonato)) {
    return null;
  }

  const existingShareKey = await findExistingTournamentShare({
    tournamentId: campeonatoId,
    access: args.access,
  });

  if (existingShareKey) {
    return existingShareKey;
  }

  const payload = createTournamentSharePayload(args.campeonato, args.videos);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shareKey = createShareKey();

    const { data: inserted, error } = await supabase
      .from("tournament_shares")
      .insert({
        share_key: shareKey,
        access: args.access,
        tournament_id: campeonatoId,
        tournament_name: campeonatoNome,
        payload,
      })
      .select("share_key")
      .single();

    if (!error && inserted?.share_key === shareKey) {
      return shareKey;
    }

    if ((error as any)?.code === "23505") {
      const retryExistingShareKey = await findExistingTournamentShare({
        tournamentId: campeonatoId,
        access: args.access,
      });

      if (retryExistingShareKey) {
        return retryExistingShareKey;
      }

      continue;
    }

    return null;
  }

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
  tournamentId?: string | null,
  expiresAt?: string,
) {
  const safeTournamentId = String(tournamentId ?? "").trim();

  if (!safeTournamentId || !isSupabaseConfigured) {
    return;
  }

  await supabase
    .from("tournament_shares")
    .update({ expires_at: expiresAt ?? new Date().toISOString() })
    .eq("tournament_id", safeTournamentId)
    .is("expires_at", null);
}
