import * as Linking from "expo-linking";
import { Platform } from "react-native";
import type { User } from "@supabase/supabase-js";

import type { LoginFormValues, RegisterFormValues } from "@/lib/validations";
import { isSupabaseConfigured, supabase } from "@/services/supabase";
import type { AuthSessionResult, UserProfile } from "@/types/auth";

type UserRow = {
  id: string;
  auth_user_id?: string | null;
  name: string;
  whatsapp_name: string;
  whatsapp_number: string;
  email: string;
  avatar_url?: string | null;
  gamertag?: string | null;
  favorite_team?: string | null;
  role: UserProfile["role"];
  created_at?: string | null;
};

function mapUserRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? null,
    name: row.name,
    whatsappName: row.whatsapp_name,
    whatsappNumber: row.whatsapp_number,
    email: row.email,
    avatarUrl: row.avatar_url ?? null,
    gamertag: row.gamertag ?? null,
    favoriteTeam: row.favorite_team ?? null,
    role: row.role,
    createdAt: row.created_at ?? undefined,
  };
}

function buildMockUser(
  overrides: Partial<UserProfile> & Pick<UserProfile, "email">,
): UserProfile {
  return {
    id: overrides.id ?? "local-user",
    authUserId: overrides.authUserId ?? null,
    name: overrides.name ?? "Jogador Arena",
    whatsappName: overrides.whatsappName ?? overrides.name ?? "Jogador Arena",
    whatsappNumber: overrides.whatsappNumber ?? "+5500000000000",
    email: overrides.email,
    avatarUrl: overrides.avatarUrl ?? null,
    gamertag: overrides.gamertag ?? "ArenaLegend",
    favoriteTeam: overrides.favoriteTeam ?? "Barcelona",
    role: overrides.role ?? "player",
    createdAt: overrides.createdAt,
  };
}

async function getProfileByAuthUserId(authUserId: string) {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, auth_user_id, name, whatsapp_name, whatsapp_number, email, avatar_url, gamertag, favorite_team, role, created_at",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapUserRow(data as UserRow) : null;
}

function buildProfilePayload(authUser: User, profile?: RegisterFormValues) {
  const metadata = authUser.user_metadata ?? {};
  const resolvedName =
    profile?.name ?? metadata.name ?? authUser.email?.split("@")[0] ?? "Jogador Arena";

  return {
    auth_user_id: authUser.id,
    name: resolvedName,
    // No cadastro atual o "nome do WhatsApp" nao e mais coletado — usamos o nome do usuario como display.
    whatsapp_name: metadata.whatsapp_name ?? resolvedName,
    whatsapp_number: profile?.whatsappNumber ?? metadata.whatsapp_number ?? "+5500000000000",
    email: authUser.email ?? profile?.email ?? "",
    gamertag: metadata.gamertag || null,
    favorite_team: metadata.favorite_team || null,
    avatar_url: metadata.avatar_url ?? null,
    // Todos cadastros novos entram como "organizer" para poderem criar e moderar proprios campeonatos.
    role: metadata.role ?? "organizer",
  };
}

async function upsertProfile(authUser: User, profile?: RegisterFormValues) {
  const payload = buildProfilePayload(authUser, profile);
  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "auth_user_id" })
    .select(
      "id, auth_user_id, name, whatsapp_name, whatsapp_number, email, avatar_url, gamertag, favorite_team, role, created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapUserRow(data as UserRow);
}

export async function restoreSession() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    return null;
  }

  const existingProfile = await getProfileByAuthUserId(session.user.id);
  return existingProfile ?? upsertProfile(session.user);
}

export async function signInWithEmail(values: LoginFormValues) {
  if (!isSupabaseConfigured) {
    return buildMockUser({
      email: values.email,
      name: values.email.split("@")[0],
      whatsappName: values.email.split("@")[0],
      role: "organizer",
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Nao foi possivel recuperar o usuario autenticado.");
  }

  const existingProfile = await getProfileByAuthUserId(data.user.id);
  return existingProfile ?? upsertProfile(data.user);
}

export async function registerWithEmail(values: RegisterFormValues): Promise<AuthSessionResult> {
  if (!isSupabaseConfigured) {
    return {
      user: buildMockUser({
        email: values.email,
        name: values.name,
        whatsappName: values.name,
        whatsappNumber: values.whatsappNumber,
        role: "organizer",
      }),
      needsEmailConfirmation: false,
    };
  }

  console.log("[auth.registerWithEmail] calling supabase.auth.signUp for", values.email);
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        name: values.name,
        whatsapp_name: values.name,
        whatsapp_number: values.whatsappNumber,
        role: "organizer",
      },
    },
  });

  if (error) {
    console.error("[auth.registerWithEmail] signUp returned error:", {
      message: error.message,
      name: error.name,
      status: (error as { status?: number }).status,
      code: (error as { code?: string }).code,
      fullError: error,
    });
    throw error;
  }

  console.log("[auth.registerWithEmail] signUp OK:", {
    userId: data.user?.id,
    hasSession: Boolean(data.session),
    emailConfirmedAt: data.user?.email_confirmed_at,
  });

  if (!data.user) {
    throw new Error("Nao foi possivel criar o usuario.");
  }

  if (!data.session) {
    return {
      user: null,
      needsEmailConfirmation: true,
      email: values.email,
    };
  }

  try {
    const profile = await upsertProfile(data.user, values);
    return {
      user: profile,
      needsEmailConfirmation: false,
    };
  } catch (profileError) {
    console.error("[auth.registerWithEmail] upsertProfile failed:", {
      message: profileError instanceof Error ? profileError.message : String(profileError),
      fullError: profileError,
    });
    throw profileError;
  }
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    throw new Error("Configure o Supabase antes de ativar o login com Google.");
  }

  const isWeb = Platform.OS === "web";
  const redirectTo =
    isWeb && typeof window !== "undefined"
      ? `${window.location.origin}/tournaments`
      : Linking.createURL("/tournaments");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      // Web: deixe o Supabase redirecionar via window.location (default).
      // Native: pedimos o URL e abrimos manualmente com Linking.
      skipBrowserRedirect: !isWeb,
    },
  });

  if (error) {
    throw error;
  }

  if (!isWeb && data?.url) {
    await Linking.openURL(data.url);
  }

  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    return true;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return true;
}
