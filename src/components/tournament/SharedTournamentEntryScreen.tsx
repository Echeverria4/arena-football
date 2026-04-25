import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  fetchTournamentShareByKey,
  parseTournamentSharePayload,
  type TournamentShareAccess,
} from "@/lib/tournament-sharing";
import { claimTournamentShare } from "@/services/tournament-collab";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useArenaDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

type SharedTournamentEntryScreenProps = {
  access?: string | string[];
  data?: string | string[];
  payload?: string | string[];
  shareKey?: string | string[];
};

const SHARE_FETCH_TIMEOUT_MS = 8000;

function normalizeAccessMode(
  rawAccess?: string | string[] | null,
): TournamentShareAccess | null {
  const access = Array.isArray(rawAccess) ? rawAccess[0] : rawAccess;

  if (access === "editor" || access === "viewer") {
    return access;
  }

  return null;
}

function resolveSingleParam(value?: string | string[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return await new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("share_fetch_timeout"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export function SharedTournamentEntryScreen({
  access,
  data,
  payload,
  shareKey,
}: SharedTournamentEntryScreenProps) {
  const hydrated = useArenaDataHydrated();
  const importarCampeonatoCompartilhado = useTournamentStore(
    (state) => state.importarCampeonatoCompartilhado,
  );
  const importarVideosCompartilhados = useVideoStore(
    (state) => state.importarVideosCompartilhados,
  );
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const setTournamentAccess = useAppStore((state) => state.setTournamentAccess);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const importStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function importSharedTournament() {
      if (!hydrated || importStartedRef.current) {
        return;
      }

      importStartedRef.current = true;
      setErrorMessage(null);

      try {
        const safeShareKey = resolveSingleParam(shareKey);
        const requestedAccess = normalizeAccessMode(access);
        const parsedPayload = parseTournamentSharePayload(payload, data);

        const resolvedShare =
          parsedPayload && requestedAccess
            ? {
                access: requestedAccess,
                campeonato: parsedPayload.campeonato,
                videos: parsedPayload.videos ?? [],
                tournamentName: parsedPayload.campeonato.nome,
              }
            : safeShareKey
              ? await withTimeout(
                  fetchTournamentShareByKey(safeShareKey),
                  SHARE_FETCH_TIMEOUT_MS,
                )
              : null;

        if (!resolvedShare?.campeonato?.id) {
          throw new Error(safeShareKey ? "share_not_found" : "share_invalid");
        }

        importarCampeonatoCompartilhado(resolvedShare.campeonato);
        importarVideosCompartilhados(
          resolvedShare.campeonato.id,
          resolvedShare.videos ?? [],
        );
        setTournamentAccess(resolvedShare.campeonato.id, resolvedShare.access);
        setCurrentTournamentId(resolvedShare.campeonato.id);

        // Se o usuario esta autenticado e entrou por um share_key, chamamos o
        // RPC claim_tournament_share para que a RLS libere o acesso direto as
        // tabelas relacionais (tournaments/matches/...) e habilite realtime.
        // Caso nao esteja autenticado, segue apenas com o snapshot local.
        const authUser = useAuthStore.getState().user;
        if (safeShareKey && authUser?.id) {
          try {
            await claimTournamentShare(safeShareKey);
          } catch (claimError) {
            console.warn("[SharedTournamentEntry] claim_tournament_share falhou:", claimError);
            // Nao bloqueia o fluxo — usuario ainda tem o snapshot local para navegar.
          }
        }

        if (!cancelled) {
          setTimeout(() => {
            router.replace({
              pathname: "/tournament/[id]",
              params: { id: resolvedShare.campeonato.id },
            });
          }, 0);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        importStartedRef.current = false;

        const errorCode = error instanceof Error ? error.message : "share_invalid";

        setErrorMessage(
          errorCode === "share_fetch_timeout"
            ? "O link demorou demais para responder. Tente abrir novamente em alguns segundos."
            : errorCode === "share_not_found"
              ? "Este link nao foi encontrado ou expirou. Gere um novo link na aba de compartilhamento."
              : "O link compartilhado esta incompleto ou invalido.",
        );
      }
    }

    void importSharedTournament();

    return () => {
      cancelled = true;
    };
  }, [
    access,
    data,
    hydrated,
    importarCampeonatoCompartilhado,
    importarVideosCompartilhados,
    payload,
    setCurrentTournamentId,
    setTournamentAccess,
    shareKey,
  ]);

  if (!hydrated) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <View className="gap-6 py-8">
          <ScreenState
            title="Carregando compartilhamento"
            description="Preparando a importacao do campeonato compartilhado."
            tone="light"
          />
        </View>
      </Screen>
    );
  }

  if (errorMessage) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#F7FAFF" }}
      >
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <SectionHeader
            eyebrow="Compartilhamento"
            title="Link invalido"
            subtitle="Nao foi possivel abrir a copia compartilhada deste campeonato."
            tone="dark"
          />
          <ScreenState
            title="Compartilhamento indisponivel"
            description={errorMessage}
            tone="light"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      className="px-6"
      backgroundVariant="none"
      style={{ backgroundColor: "#F7FAFF" }}
    >
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Compartilhamento"
          title="Abrindo campeonato"
          subtitle="Importando a copia compartilhada e aplicando o modo correto de visualizacao ou edicao."
          tone="dark"
        />
        <ScreenState
          title="Abrindo link compartilhado"
          description="Voce sera redirecionado automaticamente para o campeonato em alguns instantes."
          tone="light"
        />
      </View>
    </Screen>
  );
}
