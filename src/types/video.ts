export type VideoApprovalStatus = "pending" | "approved" | "rejected";

export interface VideoHighlight {
  id: string;
  tournamentId: string;
  matchId?: string | null;
  userId: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  approvalStatus: VideoApprovalStatus;
  votesCount: number;
  isGoalAwardWinner: boolean;
  createdAt?: string;
}
