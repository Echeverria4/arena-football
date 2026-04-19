export type VideoApprovalStatus = "pending" | "approved" | "rejected";

export interface VideoHighlight {
  id: string;
  tournamentId: string;
  tournamentName?: string | null;
  matchId?: string | null;
  userId: string;
  title: string;
  teamName?: string | null;
  teamName2?: string | null;
  playerPhone?: string | null;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  storageKey?: string | null;
  approvalStatus: VideoApprovalStatus;
  votesCount: number;
  viewsCount?: number;
  isGoalAwardWinner: boolean;
  createdAt?: string;
}
