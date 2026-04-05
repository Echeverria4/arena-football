import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import type { VideoHighlight } from "@/types/video";

type SharedVideoPayload = {
  version: 1;
  video: Pick<
    VideoHighlight,
    | "id"
    | "title"
    | "description"
    | "teamName"
    | "videoUrl"
    | "votesCount"
    | "viewsCount"
    | "tournamentName"
    | "createdAt"
  >;
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

function createSharedVideoPayload(video: VideoHighlight) {
  return {
    version: 1,
    video: {
      id: video.id,
      title: video.title,
      description: video.description ?? null,
      teamName: video.teamName ?? null,
      videoUrl: video.videoUrl,
      votesCount: video.votesCount,
      viewsCount: video.viewsCount ?? 0,
      tournamentName: video.tournamentName ?? null,
      createdAt: video.createdAt,
    },
  } satisfies SharedVideoPayload;
}

export function buildVideoShareLink(video: VideoHighlight) {
  const payload = compressToEncodedURIComponent(
    JSON.stringify(createSharedVideoPayload(video)),
  );
  const baseUrl = resolvePublicAppUrl();
  const sharePath = `/video-share?data=${payload}`;

  return baseUrl ? `${baseUrl}${sharePath}` : sharePath;
}

export function parseVideoSharePayload(rawData?: string | string[] | null) {
  const serializedData = Array.isArray(rawData) ? rawData[0] : rawData;

  if (!serializedData) {
    return null;
  }

  try {
    const decompressedPayload = decompressFromEncodedURIComponent(serializedData);

    if (!decompressedPayload) {
      return null;
    }

    const parsedPayload = JSON.parse(decompressedPayload) as SharedVideoPayload;

    if (!parsedPayload || parsedPayload.version !== 1 || !parsedPayload.video?.videoUrl) {
      return null;
    }

    return parsedPayload.video;
  } catch {
    return null;
  }
}
