import { useEffect, useRef } from "react";

import { refreshTournamentSharesPayload } from "@/lib/tournament-sharing";
import { isSupabaseConfigured } from "@/services/supabase";
import { pushCampeonatoToSupabase } from "@/services/tournament-collab";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useVideoStore } from "@/stores/video-store";
import type { Campeonato } from "@/types/tournament";

/**
 * Pushes the moderator's local Campeonato to Supabase whenever its structure
 * changes, so collaborators (editors and viewers) receive the new state via
 * realtime. Two flavors:
 *
 * 1. Initial heal — if supabaseId is missing (legacy tournament), push once
 *    on mount so the realtime channel can engage.
 *
 * 2. Re-push on structural change — debounced. Whenever the moderator adds
 *    a knockout round, edits participants, or changes status, the new
 *    matches/participants need to land in Supabase. We re-push the whole
 *    Campeonato (upserts are idempotent) on a 1.5s debounce.
 *
 * Only runs for owners (the RLS INSERT/UPDATE policies on tournaments
 * require creator/editor access, and editors don't have INSERT on tournaments
 * so they can't push from scratch — they update via the existing relational
 * row, which is what salvarPlacarJogo already does).
 */
export function useTournamentAutoPush(args: {
  campeonato: Campeonato | null | undefined;
  isOwner: boolean;
}) {
  const atualizarCampeonato = useTournamentStore(
    (state) => state.atualizarCampeonato,
  );
  const lastPushedSignatureRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const campeonato = args.campeonato;
    if (!isSupabaseConfigured || !args.isOwner || !campeonato) {
      return;
    }

    // Signature captures everything that, when changed, requires re-push.
    // Match scores are already write-back'd individually via salvarPlacarJogo,
    // so the signature ignores placares to avoid re-pushing the whole tree
    // on every score save.
    // Inclui campos editaveis dos participantes (nome, time, whatsapp...) e
    // configuracoes do campeonato (regras, formato, flags) para que
    // visualizadores recebam essas mudancas via re-push + refresh do
    // payload em tournament_shares.
    const signature = JSON.stringify({
      hasSupabaseId: Boolean(campeonato.supabaseId),
      status: campeonato.status,
      nome: campeonato.nome,
      formato: campeonato.formato,
      modoConfronto: campeonato.modoConfronto,
      modoConfrontoMataMata: campeonato.modoConfrontoMataMata ?? null,
      numGrupos: campeonato.numGrupos ?? null,
      gruposClassificacaoModo: campeonato.gruposClassificacaoModo ?? null,
      regras: campeonato.regras ?? null,
      allowVideos: campeonato.allowVideos ?? null,
      allowGoalAward: campeonato.allowGoalAward ?? null,
      criteriosClassificacao: campeonato.criteriosClassificacao ?? null,
      participantCount: campeonato.participantes.length,
      participants: campeonato.participantes.map((p) => ({
        id: p.id,
        nome: p.nome,
        time: p.time,
        whatsapp: p.whatsapp ?? null,
        timeImagem: p.timeImagem ?? null,
        timeTipoIcone: p.timeTipoIcone ?? null,
        grupo: p.grupo ?? null,
      })),
      roundCount: campeonato.rodadas.length,
      matchIds: campeonato.rodadas.flatMap((r) => r.map((m) => m.id)),
      classificadosDiretosIds: campeonato.classificadosDiretosIds ?? null,
    });

    if (signature === lastPushedSignatureRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const authUser = useAuthStore.getState().user;
      if (!authUser?.id) {
        return;
      }

      void (async () => {
        try {
          const result = await pushCampeonatoToSupabase(campeonato, authUser.id);
          atualizarCampeonato(campeonato.id, {
            supabaseId: result.campeonato.supabaseId,
            participantes: result.campeonato.participantes,
            rodadas: result.campeonato.rodadas,
          });
          lastPushedSignatureRef.current = signature;
          console.log(
            "[useTournamentAutoPush] pushed " +
              campeonato.id +
              " → " +
              result.tournamentId,
          );

          // Atualiza o snapshot em tournament_shares para que visualizadores/
          // editores conectados recebam a edicao via poll do payload.
          const tournamentVideos = useVideoStore
            .getState()
            .videos.filter((video) => video.tournamentId === campeonato.id);
          await refreshTournamentSharesPayload({
            tournamentId: result.tournamentId,
            campeonato: result.campeonato,
            videos: tournamentVideos,
          });
        } catch (error) {
          console.warn(
            "[useTournamentAutoPush] push failed: " +
              JSON.stringify({
                message: (error as { message?: string })?.message,
                code: (error as { code?: string })?.code,
              }),
          );
        }
      })();
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [args.campeonato, args.isOwner, atualizarCampeonato]);
}
