import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import {
  GLOBAL_VIDEO_PANEL_ID,
  GLOBAL_VIDEO_PANEL_NAME,
} from "@/lib/video-panel";
import type { VideoHighlight } from "@/types/video";

export type SharedVideoPanelAccess = "moderator" | "viewer";

type SharedVideoPanelPayload = {
  version: 1;
  videos: VideoHighlight[];
  voterPhones: string[];
  votesByPhone: Record<string, string>;
  votingClosed: boolean;
  votingClosedAt?: string | null;
  winningVideoId?: string | null;
};

function normalizeBaseUrl(url: string) {
  return String(url).trim().replace(/\/+$/, "");
}

function resolvePublicAppUrl() {
  const envUrl =
    typeof process !== "undefined" && process.env
      ? process.env.EXPO_PUBLIC_APP_URL
      : undefined;

  if (envUrl && String(envUrl).trim()) {
    return normalizeBaseUrl(String(envUrl));
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  return null;
}

function createPanelPayload(input: {
  videos: VideoHighlight[];
  voterPhones: string[];
  votesByPhone: Record<string, string>;
  votingClosed: boolean;
  votingClosedAt?: string | null;
  winningVideoId?: string | null;
}) {
  return {
    version: 1,
    videos: input.videos
      .filter((video) => video.tournamentId === GLOBAL_VIDEO_PANEL_ID)
      .map((video) => ({
        ...video,
        tournamentId: GLOBAL_VIDEO_PANEL_ID,
        tournamentName: GLOBAL_VIDEO_PANEL_NAME,
      })),
    voterPhones: [...input.voterPhones],
    votesByPhone: { ...input.votesByPhone },
    votingClosed: Boolean(input.votingClosed),
    votingClosedAt: input.votingClosedAt ?? null,
    winningVideoId: input.winningVideoId ?? null,
  } satisfies SharedVideoPanelPayload;
}

export function buildVideoPanelShareLink(input: {
  access: SharedVideoPanelAccess;
  videos: VideoHighlight[];
  voterPhones: string[];
  votesByPhone: Record<string, string>;
  votingClosed: boolean;
  votingClosedAt?: string | null;
  winningVideoId?: string | null;
}) {
  const payload = compressToEncodedURIComponent(
    JSON.stringify(
      createPanelPayload({
        videos: input.videos,
        voterPhones: input.voterPhones,
        votesByPhone: input.votesByPhone,
        votingClosed: input.votingClosed,
        votingClosedAt: input.votingClosedAt,
        winningVideoId: input.winningVideoId,
      }),
    ),
  );

  const baseUrl = resolvePublicAppUrl();
  const sharePath = `/video-panel/share?access=${input.access}&data=${payload}`;

  return baseUrl ? `${baseUrl}${sharePath}` : sharePath;
}

export function parseSharedVideoPanelAccess(
  rawAccess?: string | string[] | null,
): SharedVideoPanelAccess | null {
  const access = Array.isArray(rawAccess) ? rawAccess[0] : rawAccess;

  if (access === "moderator" || access === "viewer") {
    return access;
  }

  return null;
}

export function parseVideoPanelSharePayload(rawData?: string | string[] | null) {
  const serializedData = Array.isArray(rawData) ? rawData[0] : rawData;

  if (!serializedData) {
    return null;
  }

  try {
    const decompressedPayload = decompressFromEncodedURIComponent(serializedData);

    if (!decompressedPayload) {
      return null;
    }

    const parsedPayload = JSON.parse(decompressedPayload) as SharedVideoPanelPayload;

    if (!parsedPayload || parsedPayload.version !== 1 || !Array.isArray(parsedPayload.videos)) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}
