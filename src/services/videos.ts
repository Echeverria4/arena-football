import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { useVideoStore } from "@/stores/video-store";
import type { VideoApprovalStatus, VideoHighlight } from "@/types/video";

type VideoRow = {
  id: string;
  tournament_id: string;
  match_id?: string | null;
  user_id: string;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  approval_status: VideoApprovalStatus;
  votes_count: number;
  is_goal_award_winner: boolean;
  created_at?: string | null;
};

function mapVideoRow(row: VideoRow, tournamentName?: string): VideoHighlight {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    tournamentName: tournamentName,
    matchId: row.match_id ?? undefined,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    approvalStatus: row.approval_status,
    votesCount: row.votes_count,
    isGoalAwardWinner: row.is_goal_award_winner,
    createdAt: row.created_at ?? undefined,
  };
}

function buildMockVideo(
  overrides: {
    createdByName: string;
    tournamentId: string;
    tournamentName: string;
    title: string;
    teamName: string;
    userId: string;
    videoUrl: string;
    fileName?: string | null;
    fileSizeBytes?: number | null;
    mimeType?: string | null;
    storageKey?: string | null;
  },
): VideoHighlight {
  return {
    id: `video-${Date.now()}`,
    tournamentId: overrides.tournamentId,
    tournamentName: overrides.tournamentName,
    userId: overrides.userId,
    title: overrides.title,
    teamName: overrides.teamName,
    videoUrl: overrides.videoUrl,
    fileName: overrides.fileName,
    fileSizeBytes: overrides.fileSizeBytes,
    mimeType: overrides.mimeType,
    storageKey: overrides.storageKey,
    approvalStatus: "pending",
    votesCount: 0,
    isGoalAwardWinner: false,
    createdAt: new Date().toISOString(),
  };
}

export async function listVideosByTournament(tournamentId?: string): Promise<VideoHighlight[]> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    const videos = useVideoStore.getState().videos;

    if (!tournamentId) {
      return videos;
    }

    return videos.filter((video) => video.tournamentId === tournamentId);
  }

  let query = supabase.from("videos").select("id, tournament_id, match_id, user_id, title, description, video_url, thumbnail_url, approval_status, votes_count, is_goal_award_winner, created_at");

  if (tournamentId) {
    query = query.eq("tournament_id", tournamentId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapVideoRow(row as VideoRow));
}

export interface UploadVideoHighlightInput {
  createdByName: string;
  tournamentId: string;
  tournamentName: string;
  title: string;
  teamName: string;
  userId: string;
  videoUrl: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  storageKey?: string | null;
}

export async function uploadVideoHighlight(input: UploadVideoHighlightInput): Promise<VideoHighlight> {
  // Fallback to local store when Supabase is not configured
  if (!isSupabaseConfigured) {
    return useVideoStore.getState().addVideo(input);
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      tournament_id: input.tournamentId,
      user_id: input.userId,
      title: input.title,
      video_url: input.videoUrl,
      approval_status: "pending",
    })
    .select("id, tournament_id, match_id, user_id, title, description, video_url, thumbnail_url, approval_status, votes_count, is_goal_award_winner, created_at")
    .single();

  if (error) {
    throw error;
  }

  return mapVideoRow(data as VideoRow, input.tournamentName);
}
