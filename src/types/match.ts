export type MatchStatus = "pending" | "in_progress" | "finished";

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  phase: string;
  homeParticipantId: string;
  awayParticipantId: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  roomCreatorParticipantId?: string | null;
  deadlineAt?: string | null;
  status: MatchStatus;
}

export interface MatchResultSubmission {
  id: string;
  matchId: string;
  submittedByUserId: string;
  homeGoals: number;
  awayGoals: number;
  approvedByCreator: boolean;
  submittedAt: string;
}
