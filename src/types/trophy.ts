export type TrophyCategory =
  | "champion"
  | "runner_up"
  | "top_scorer"
  | "best_defense"
  | "best_goal"
  | "highlight_organizer"
  | "win_streak";

export interface Trophy {
  id: string;
  tournamentId?: string | null;
  userId: string;
  category: TrophyCategory;
  title: string;
  imageUrl?: string | null;
  awardedAt?: string;
}
