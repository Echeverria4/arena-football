export type TournamentFormat =
  | "league"
  | "groups"
  | "knockout"
  | "groups_knockout";

export type TournamentStatus = "draft" | "open" | "in_progress" | "finished";

export interface Tournament {
  id: string;
  name: string;
  coverUrl?: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  rules?: string | null;
  creatorId: string;
  startDate?: string | null;
  allowVideos: boolean;
  allowGoalAward: boolean;
  createdAt?: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  teamName: string;
  teamBadgeUrl?: string | null;
  stadiumImageUrl?: string | null;
  groupName?: string | null;
  isOrganizer: boolean;
  displayName: string;
}

export interface StandingEntry {
  participantId: string;
  played: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface HistoricalPerformance {
  userId: string;
  championshipsPlayed: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  titles: number;
}
