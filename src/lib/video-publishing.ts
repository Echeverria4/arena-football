import type { ImportedVideoAsset } from "@/lib/local-video-assets";
import {
  GLOBAL_VIDEO_PANEL_ID,
  GLOBAL_VIDEO_PANEL_NAME,
  normalizeVideoVoterPhone,
} from "@/lib/video-panel";
import { normalizePublicVideoUrl } from "@/lib/video-links";

export type GlobalVideoPublishError =
  | "missing_title"
  | "invalid_public_url"
  | "missing_source";

export interface GlobalVideoPublishInput {
  createdByName?: string | null;
  title: string;
  teamName?: string | null;
  description?: string | null;
  playerPhone?: string | null;
  userId?: string | null;
  publicVideoUrl?: string | null;
  importedVideoAsset?: ImportedVideoAsset | null;
}

export interface PreparedGlobalVideoPayload {
  createdByName: string;
  tournamentId: string;
  tournamentName: string;
  title: string;
  teamName: string;
  description?: string | null;
  playerPhone?: string | null;
  userId: string;
  videoUrl: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  storageKey?: string | null;
}

export type PrepareGlobalVideoPayloadResult =
  | {
      ok: true;
      normalizedPublicVideoUrl: string | null;
      payload: PreparedGlobalVideoPayload;
    }
  | {
      ok: false;
      error: GlobalVideoPublishError;
    };

export function prepareGlobalVideoPayload(
  input: GlobalVideoPublishInput,
): PrepareGlobalVideoPayloadResult {
  const normalizedTitle = input.title.trim();

  if (!normalizedTitle) {
    return { ok: false, error: "missing_title" };
  }

  const normalizedPublicVideoUrl = normalizePublicVideoUrl(input.publicVideoUrl);

  if (String(input.publicVideoUrl ?? "").trim() && !normalizedPublicVideoUrl) {
    return { ok: false, error: "invalid_public_url" };
  }

  if (!normalizedPublicVideoUrl && !input.importedVideoAsset) {
    return { ok: false, error: "missing_source" };
  }

  return {
    ok: true,
    normalizedPublicVideoUrl,
    payload: {
      createdByName: String(input.createdByName ?? "").trim() || "Organizador",
      tournamentId: GLOBAL_VIDEO_PANEL_ID,
      tournamentName: GLOBAL_VIDEO_PANEL_NAME,
      title: normalizedTitle,
      teamName: String(input.teamName ?? "").trim(),
      description: String(input.description ?? "").trim() || null,
      playerPhone: normalizeVideoVoterPhone(String(input.playerPhone ?? "")) || null,
      userId: String(input.userId ?? "").trim() || "global-video-admin",
      videoUrl: normalizedPublicVideoUrl ?? input.importedVideoAsset!.videoUrl,
      fileName: normalizedPublicVideoUrl ? null : input.importedVideoAsset?.fileName,
      fileSizeBytes: normalizedPublicVideoUrl ? null : input.importedVideoAsset?.fileSizeBytes,
      mimeType: normalizedPublicVideoUrl ? null : input.importedVideoAsset?.mimeType,
      storageKey: normalizedPublicVideoUrl ? null : input.importedVideoAsset?.storageKey,
    },
  };
}
