import { useEffect, useRef } from "react";

import { fetchTournamentShareSnapshotByKey } from "@/lib/tournament-sharing";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useVideoStore } from "@/stores/video-store";

const SNAPSHOT_POLL_INTERVAL_MS = 8000;

/**
 * Para visualizadores e editores que entraram via link compartilhado, busca
 * periodicamente o payload em tournament_shares e aplica no store local. O
 * payload e atualizado pelo moderador via useTournamentAutoPush a cada
 * edicao estrutural (participantes, regras, formato, novas rodadas), entao
 * esse poll serve como canal de "tudo o que nao for placar".
 *
 * Placares ja sao tratados em useTournamentRealtimeSync (que e mais rapido
 * via realtime/postgres_changes na tabela matches). Aqui o intervalo e
 * proposital um pouco maior (8s) porque mudancas estruturais sao raras.
 */
export function useTournamentSnapshotSync(args: {
  campeonatoId: string | undefined;
}) {
  const importarCampeonatoCompartilhado = useTournamentStore(
    (state) => state.importarCampeonatoCompartilhado,
  );
  const importarVideosCompartilhados = useVideoStore(
    (state) => state.importarVideosCompartilhados,
  );
  const accessMode = useAppStore((state) =>
    args.campeonatoId ? state.tournamentAccess[args.campeonatoId] : undefined,
  );
  const shareKey = useAppStore((state) =>
    args.campeonatoId ? state.tournamentShareKeys[args.campeonatoId] : undefined,
  );
  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    // So aplica para quem entrou via link compartilhado (viewer/editor) e
    // tem o shareKey salvo. Owner ja tem o estado local autoritativo —
    // sincronizar via snapshot causaria flicker e sobrescreveria edicoes
    // locais nao-pushadas ainda.
    if (!args.campeonatoId || !shareKey) return;
    if (accessMode !== "viewer" && accessMode !== "editor") return;

    let cancelled = false;

    async function reconcileSnapshot() {
      try {
        const snapshot = await fetchTournamentShareSnapshotByKey(shareKey);
        if (cancelled || !snapshot?.campeonato) return;

        // Assina apenas campos estruturais para detectar mudanca. Placares
        // ficam fora pra evitar conflito com o realtime de matches.
        const signature = JSON.stringify({
          nome: snapshot.campeonato.nome,
          status: snapshot.campeonato.status,
          formato: snapshot.campeonato.formato,
          modoConfronto: snapshot.campeonato.modoConfronto,
          regras: snapshot.campeonato.regras ?? null,
          numGrupos: snapshot.campeonato.numGrupos ?? null,
          gruposClassificacaoModo: snapshot.campeonato.gruposClassificacaoModo ?? null,
          allowVideos: snapshot.campeonato.allowVideos ?? null,
          allowGoalAward: snapshot.campeonato.allowGoalAward ?? null,
          participantes: (snapshot.campeonato.participantes ?? []).map((p: any) => ({
            id: p.id,
            nome: p.nome,
            time: p.time,
            whatsapp: p.whatsapp ?? null,
            timeImagem: p.timeImagem ?? null,
            timeTipoIcone: p.timeTipoIcone ?? null,
            grupo: p.grupo ?? null,
          })),
          rodadasShape: (snapshot.campeonato.rodadas ?? []).map(
            (r: any[]) => r.map((m) => m.id),
          ),
          videosCount: (snapshot.videos ?? []).length,
        });

        if (signature === lastSignatureRef.current) return;
        lastSignatureRef.current = signature;

        importarCampeonatoCompartilhado(snapshot.campeonato);
        importarVideosCompartilhados(
          snapshot.campeonato.id,
          snapshot.videos ?? [],
        );
      } catch (error) {
        console.warn(
          "[useTournamentSnapshotSync] reconcile failed: " +
            JSON.stringify({
              message: (error as { message?: string })?.message,
            }),
        );
      }
    }

    // Reconcile inicial e re-sync ao voltar a aba.
    void reconcileSnapshot();

    function handleVisibilityChange() {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        void reconcileSnapshot();
      }
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void reconcileSnapshot();
    }, SNAPSHOT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [
    accessMode,
    args.campeonatoId,
    importarCampeonatoCompartilhado,
    importarVideosCompartilhados,
    shareKey,
  ]);
}
