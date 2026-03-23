export type UserRole = "player" | "organizer" | "admin";
export type AuthStatus = "loading" | "authenticated" | "guest";

export interface UserProfile {
  id: string;
  authUserId?: string | null;
  name: string;
  whatsappName: string;
  whatsappNumber: string;
  email: string;
  avatarUrl?: string | null;
  gamertag?: string | null;
  favoriteTeam?: string | null;
  role: UserRole;
  createdAt?: string;
}

export interface AuthSessionResult {
  user: UserProfile | null;
  needsEmailConfirmation?: boolean;
  email?: string;
}
