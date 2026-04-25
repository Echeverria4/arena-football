import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";

import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth-store";

declare global {
  // Google Identity Services — loaded via <script> in app/+html.tsx.
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              logo_alignment?: "left" | "center";
              locale?: string;
              width?: number | string;
            },
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function GoogleSignInButton({ onError, onSuccess }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;
    if (!clientId) {
      setLoadError("EXPO_PUBLIC_GOOGLE_CLIENT_ID nao esta configurado.");
      return;
    }

    // Ensure GIS script is injected — in Expo dev mode +html.tsx may not be used.
    const SCRIPT_ID = "google-gis-script";
    let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = SCRIPT_ID;
      scriptEl.src = "https://accounts.google.com/gsi/client";
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.onerror = () => {
        console.error("[google-signin] failed to load GIS script");
        setLoadError("Nao foi possivel carregar a biblioteca do Google. Verifique conexao/VPN/bloqueador.");
      };
      document.head.appendChild(scriptEl);
      console.log("[google-signin] GIS script injected dynamically");
    }

    let cancelled = false;
    let retries = 0;

    const initialize = () => {
      if (cancelled) return;
      const gis = typeof window !== "undefined" ? window.google?.accounts?.id : undefined;

      if (!gis) {
        retries += 1;
        if (retries > 120) {
          setLoadError(
            "Biblioteca do Google demorou demais para carregar. Abra Network tab e veja se 'gsi/client' foi bloqueado.",
          );
          return;
        }
        setTimeout(initialize, 250);
        return;
      }

      gis.initialize({
        client_id: clientId,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });

            if (error) {
              console.error("[google-signin] signInWithIdToken error:", error);
              onError?.(error);
              return;
            }

            // O listener onAuthStateChange no _layout.tsx ja hidrata a sessao,
            // mas setamos o user aqui tambem para um redirect imediato se necessario.
            if (data.user) {
              const existingProfileQuery = await supabase
                .from("users")
                .select(
                  "id, auth_user_id, name, whatsapp_name, whatsapp_number, email, avatar_url, gamertag, favorite_team, role, created_at",
                )
                .eq("auth_user_id", data.user.id)
                .maybeSingle();

              if (existingProfileQuery.data) {
                setUser({
                  id: existingProfileQuery.data.id,
                  authUserId: existingProfileQuery.data.auth_user_id,
                  name: existingProfileQuery.data.name,
                  whatsappName: existingProfileQuery.data.whatsapp_name,
                  whatsappNumber: existingProfileQuery.data.whatsapp_number,
                  email: existingProfileQuery.data.email,
                  avatarUrl: existingProfileQuery.data.avatar_url ?? null,
                  gamertag: existingProfileQuery.data.gamertag ?? null,
                  favoriteTeam: existingProfileQuery.data.favorite_team ?? null,
                  role: existingProfileQuery.data.role,
                  createdAt: existingProfileQuery.data.created_at ?? undefined,
                });
              }
            }

            onSuccess?.();
          } catch (error) {
            console.error("[google-signin] callback threw:", error);
            onError?.(error instanceof Error ? error : new Error("Erro desconhecido."));
          }
        },
      });

      if (containerRef.current) {
        gis.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          text: "continue_with",
          locale: "pt-BR",
          width: 320,
        });
        setReady(true);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [clientId, onError, onSuccess, setUser]);

  if (Platform.OS !== "web") return null;

  if (!clientId) {
    return (
      <Text style={{ color: "#94A3B8", fontSize: 12 }}>
        Google Sign-In desabilitado: defina EXPO_PUBLIC_GOOGLE_CLIENT_ID no .env.
      </Text>
    );
  }

  if (loadError) {
    return (
      <Text style={{ color: "#FCA5B4", fontSize: 12 }}>{loadError}</Text>
    );
  }

  return (
    <View style={{ alignItems: "center" }}>
      {/* react-native-web renderiza View como <div>; injetamos o ref para a GIS desenhar dentro. */}
      <View
        ref={containerRef as unknown as React.RefObject<View>}
        style={{ minHeight: 44 }}
      />
      {!ready ? (
        <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>
          Carregando botao do Google...
        </Text>
      ) : null}
    </View>
  );
}
