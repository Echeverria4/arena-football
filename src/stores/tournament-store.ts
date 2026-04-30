import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { HOUR_MS, syncExpiredCampeonatoRounds } from "@/lib/tournament-deadlines";
import { expireTournamentSharesByTournamentId } from "@/lib/tournament-sharing";
import {
  recomputeCampeonatoClassificacao,
  resetMatchInCampeonato,
  saveCampeonatoMatchScore,
} from "@/lib/tournament-results";
import { pushMatchScore } from "@/services/tournament-realtime";
import {
  type KnockoutFirstRoundResult,
  generateKnockoutFirstRound,
  generateNextKnockoutRound,
  hydrateCampeonatoStructure,
} from "@/lib/tournament-setup";
import { persistStorage } from "@/stores/persist-storage";
import type { Campeonato } from "@/types/tournament";

interface TournamentState {
  campeonatos: Campeonato[];
  selectedCampeonato: Campeonato | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  repairCampeonatosLegados: () => void;
  setSelectedCampeonato: (campeonato: Campeonato | null) => void;
  adicionarCampeonato: (campeonato: Campeonato) => void;
  importarCampeonatoCompartilhado: (campeonato: Campeonato) => void;
  removerCampeonato: (id: string) => void;
  limparTodosCampeonatos: () => void;
  atualizarCampeonato: (id: string, patch: Partial<Campeonato>) => void;
  salvarPlacarJogo: (
    campeonatoId: string,
    jogoId: string,
    placarMandante: number,
    placarVisitante: number,
  ) => void;
  aplicarPlacarRemoto: (
    supabaseTournamentId: string,
    supabaseMatchId: string,
    placarMandante: number | null,
    placarVisitante: number | null,
    finalizado: boolean,
  ) => void;
  ajustarTempoExtraRodada: (campeonatoId: string, rodada: number, deltaMs: number) => void;
  sincronizarPrazosRodadas: (now?: string) => void;
  definirRodasComPrazo: (campeonatoId: string, rounds: number[]) => void;
  resetarJogo: (campeonatoId: string, jogoId: string) => void;
  gerarFaseMataMataCampeonato: (id: string) => void;
  gerarProximaFaseMataMata: (id: string) => void;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set) => ({
      campeonatos: [],
      selectedCampeonato: null,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      repairCampeonatosLegados: () =>
        set((state) => ({
          campeonatos: state.campeonatos.map(hydrateCampeonatoStructure),
          selectedCampeonato: state.selectedCampeonato
            ? hydrateCampeonatoStructure(state.selectedCampeonato)
            : null,
        })),
      setSelectedCampeonato: (campeonato) =>
        set({
          selectedCampeonato: campeonato ? hydrateCampeonatoStructure(campeonato) : null,
        }),
      adicionarCampeonato: (campeonato) =>
        set((state) => ({
          campeonatos: [...state.campeonatos, hydrateCampeonatoStructure(campeonato)],
        })),
      importarCampeonatoCompartilhado: (campeonato) =>
        set((state) => {
          const normalized = hydrateCampeonatoStructure(campeonato);
          const exists = state.campeonatos.some((item) => item.id === normalized.id);

          return {
            campeonatos: exists
              ? state.campeonatos.map((item) =>
                  item.id === normalized.id ? normalized : item,
                )
              : [...state.campeonatos, normalized],
            selectedCampeonato:
              state.selectedCampeonato?.id === normalized.id
                ? normalized
                : state.selectedCampeonato,
          };
        }),
      removerCampeonato: (id) =>
        set((state) => ({
          campeonatos: state.campeonatos.filter((campeonato) => campeonato.id !== id),
          selectedCampeonato:
            state.selectedCampeonato?.id === id ? null : state.selectedCampeonato,
        })),
      limparTodosCampeonatos: () =>
        set({ campeonatos: [], selectedCampeonato: null }),
      atualizarCampeonato: (id, patch) => {
        let shouldExpireShares = false;
        let supabaseIdToExpire: string | undefined;

        set((state) => ({
          campeonatos: state.campeonatos.map((campeonato) => {
            if (campeonato.id !== id) {
              return campeonato;
            }

            const updatedCampeonato = hydrateCampeonatoStructure({ ...campeonato, ...patch });

            if (
              campeonato.status !== "finalizado" &&
              updatedCampeonato.status === "finalizado"
            ) {
              shouldExpireShares = true;
              supabaseIdToExpire = updatedCampeonato.supabaseId;
            }

            return updatedCampeonato;
          }),
          selectedCampeonato:
            state.selectedCampeonato?.id === id
              ? hydrateCampeonatoStructure({ ...state.selectedCampeonato, ...patch })
              : state.selectedCampeonato,
        }));

        if (shouldExpireShares) {
          const idsToExpire = [id, supabaseIdToExpire].filter((v): v is string => Boolean(v));
          void expireTournamentSharesByTournamentId(idsToExpire);
        }
      },
      salvarPlacarJogo: (campeonatoId, jogoId, placarMandante, placarVisitante) => {
        let shouldExpireShares = false;
        let supabaseMatchId: string | undefined;
        let matchFinalizado = false;

        set((state) => {
          const updateCampeonato = (campeonato: Campeonato) =>
            {
              if (campeonato.id !== campeonatoId) {
                return campeonato;
              }

              const updatedCampeonato = hydrateCampeonatoStructure(
                saveCampeonatoMatchScore(campeonato, jogoId, placarMandante, placarVisitante),
              );

              const updatedJogo = updatedCampeonato.rodadas
                .flat()
                .find((j) => j.id === jogoId);
              if (updatedJogo?.supabaseId) {
                supabaseMatchId = updatedJogo.supabaseId;
                matchFinalizado = updatedJogo.status === "finalizado";
              }

              if (
                campeonato.status !== "finalizado" &&
                updatedCampeonato.status === "finalizado"
              ) {
                shouldExpireShares = true;
              }

              return updatedCampeonato;
            };

          return {
            campeonatos: state.campeonatos.map(updateCampeonato),
            selectedCampeonato: state.selectedCampeonato
              ? updateCampeonato(state.selectedCampeonato)
              : state.selectedCampeonato,
          };
        });

        if (shouldExpireShares) {
          void expireTournamentSharesByTournamentId(campeonatoId);
        }

        // Write-back: keep the relational `matches` row in sync so other
        // collaborators receive this score via realtime.
        if (supabaseMatchId) {
          console.log(
            "[salvarPlacarJogo] pushing match score: " +
              JSON.stringify({ supabaseMatchId, placarMandante, placarVisitante, matchFinalizado }),
          );
          void pushMatchScore({
            supabaseMatchId,
            homeGoals: placarMandante,
            awayGoals: placarVisitante,
            status: matchFinalizado ? "finished" : "pending",
          });
        } else {
          console.warn(
            "[salvarPlacarJogo] match has no supabaseId — write-back skipped. campeonatoId=" +
              campeonatoId +
              " jogoId=" +
              jogoId +
              ". Esse placar NAO sera replicado para outros visualizadores.",
          );
        }
      },
      aplicarPlacarRemoto: (
        supabaseTournamentId,
        supabaseMatchId,
        placarMandante,
        placarVisitante,
        finalizado,
      ) =>
        set((state) => {
          const updateCampeonato = (campeonato: Campeonato) => {
            if (campeonato.supabaseId !== supabaseTournamentId) {
              return campeonato;
            }

            let touched = false;
            const novasRodadas = campeonato.rodadas.map((rodada) =>
              rodada.map((jogo) => {
                if (jogo.supabaseId !== supabaseMatchId) {
                  return jogo;
                }

                const sameScore =
                  jogo.placarMandante === placarMandante &&
                  jogo.placarVisitante === placarVisitante &&
                  jogo.status === (finalizado ? "finalizado" : "pendente");

                if (sameScore) {
                  return jogo;
                }

                touched = true;
                return {
                  ...jogo,
                  placarMandante,
                  placarVisitante,
                  status: finalizado ? "finalizado" : "pendente",
                } satisfies Campeonato["rodadas"][number][number];
              }),
            );

            if (!touched) {
              return campeonato;
            }

            // Recomputa classificacao APOS aplicar o placar remoto.
            // hydrateCampeonatoStructure so recalcula quando classificacao
            // esta vazia, entao precisamos forcar a recomputacao aqui — caso
            // contrario a tabela de classificacao fica defasada apesar do
            // placar nas rodadas estar atualizado.
            const campeonatoComPlacar = {
              ...campeonato,
              rodadas: novasRodadas,
            };

            return hydrateCampeonatoStructure({
              ...campeonatoComPlacar,
              classificacao: recomputeCampeonatoClassificacao(campeonatoComPlacar),
            });
          };

          return {
            campeonatos: state.campeonatos.map(updateCampeonato),
            selectedCampeonato: state.selectedCampeonato
              ? updateCampeonato(state.selectedCampeonato)
              : state.selectedCampeonato,
          };
        }),
      ajustarTempoExtraRodada: (campeonatoId, rodada, deltaMs) =>
        set((state) => {
          const updateCampeonato = (campeonato: Campeonato) => {
            if (campeonato.id !== campeonatoId) {
              return campeonato;
            }

            const currentExtra = campeonato.tempoExtraRodadasMs?.[String(rodada)] ?? 0;
            const nextExtra = Math.max(-7 * HOUR_MS * 24, Math.min(7 * HOUR_MS * 24, currentExtra + deltaMs));
            const nextMap = {
              ...(campeonato.tempoExtraRodadasMs ?? {}),
            };

            if (nextExtra === 0) {
              delete nextMap[String(rodada)];
            } else {
              nextMap[String(rodada)] = nextExtra;
            }

            return hydrateCampeonatoStructure({
              ...campeonato,
              tempoExtraRodadasMs: nextMap,
            });
          };

          return {
            campeonatos: state.campeonatos.map(updateCampeonato),
            selectedCampeonato: state.selectedCampeonato
              ? updateCampeonato(state.selectedCampeonato)
              : state.selectedCampeonato,
          };
        }),
      sincronizarPrazosRodadas: (now) => {
        const finalizedTournamentIds = new Set<string>();
        const currentTime = now ? new Date(now) : new Date();

        set((state) => {
          let changed = false;

          const updateCampeonato = (campeonato: Campeonato) => {
            const result = syncExpiredCampeonatoRounds(campeonato, currentTime);

            if (!result.changed) {
              return campeonato;
            }

            changed = true;

            if (
              campeonato.status !== "finalizado" &&
              result.campeonato.status === "finalizado"
            ) {
              finalizedTournamentIds.add(campeonato.id);
            }

            return result.campeonato;
          };

          const campeonatos = state.campeonatos.map(updateCampeonato);
          const selectedCampeonato = state.selectedCampeonato
            ? updateCampeonato(state.selectedCampeonato)
            : state.selectedCampeonato;

          if (!changed) {
            return state;
          }

          return {
            campeonatos,
            selectedCampeonato,
          };
        });

        if (finalizedTournamentIds.size > 0) {
          void Promise.all(
            Array.from(finalizedTournamentIds).map((campeonatoId) =>
              expireTournamentSharesByTournamentId(campeonatoId),
            ),
          );
        }
      },
      definirRodasComPrazo: (campeonatoId, rounds) =>
        set((state) => {
          const update = (campeonato: Campeonato) => {
            if (campeonato.id !== campeonatoId) return campeonato;
            return hydrateCampeonatoStructure({
              ...campeonato,
              prazoRodasAtivas: rounds.length > 0 ? rounds : undefined,
            });
          };
          return {
            campeonatos: state.campeonatos.map(update),
            selectedCampeonato: state.selectedCampeonato
              ? update(state.selectedCampeonato)
              : state.selectedCampeonato,
          };
        }),
      resetarJogo: (campeonatoId, jogoId) => {
        let supabaseMatchId: string | undefined;

        set((state) => {
          const update = (campeonato: Campeonato) => {
            if (campeonato.id !== campeonatoId) return campeonato;
            const updated = resetMatchInCampeonato(campeonato, jogoId);
            const jogo = updated.rodadas.flat().find((j) => j.id === jogoId);
            if (jogo?.supabaseId) supabaseMatchId = jogo.supabaseId;
            return hydrateCampeonatoStructure(updated);
          };
          return {
            campeonatos: state.campeonatos.map(update),
            selectedCampeonato: state.selectedCampeonato
              ? update(state.selectedCampeonato)
              : state.selectedCampeonato,
          };
        });

        if (supabaseMatchId) {
          void pushMatchScore({
            supabaseMatchId,
            homeGoals: null,
            awayGoals: null,
            status: "pending",
          });
        }
      },
      gerarFaseMataMataCampeonato: (id) =>
        set((state) => {
          const patch = (campeonato: Campeonato) => {
            if (campeonato.id !== id) return campeonato;
            // Guard: don't generate if KO rounds already exist (idempotent)
            const numRodGrupos = campeonato.numRodadasGrupos ?? 0;
            if (numRodGrupos > 0 && campeonato.rodadas.length > numRodGrupos) return campeonato;
            const result: KnockoutFirstRoundResult = generateKnockoutFirstRound(campeonato);
            if (result.rounds.length === 0) return campeonato;
            return hydrateCampeonatoStructure({
              ...campeonato,
              rodadas: [...campeonato.rodadas, ...result.rounds],
              classificadosDiretosIds: result.classificadosDiretosIds ?? undefined,
            });
          };
          return {
            campeonatos: state.campeonatos.map(patch),
            selectedCampeonato: state.selectedCampeonato ? patch(state.selectedCampeonato) : state.selectedCampeonato,
          };
        }),
      gerarProximaFaseMataMata: (id) =>
        set((state) => {
          const patch = (campeonato: Campeonato) => {
            if (campeonato.id !== id) return campeonato;
            const result = generateNextKnockoutRound(campeonato);
            if (result.rounds.length === 0) return campeonato;
            return hydrateCampeonatoStructure({
              ...campeonato,
              rodadas: [...campeonato.rodadas, ...result.rounds],
              classificadosDiretosIds: result.clearDiretos ? undefined : campeonato.classificadosDiretosIds,
            });
          };
          return {
            campeonatos: state.campeonatos.map(patch),
            selectedCampeonato: state.selectedCampeonato ? patch(state.selectedCampeonato) : state.selectedCampeonato,
          };
        }),
    }),
    {
      name: "arena-tournament-store",
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        campeonatos: state.campeonatos,
        selectedCampeonato: state.selectedCampeonato,
      }),
      onRehydrateStorage: () => (state) => {
        state?.repairCampeonatosLegados();
        state?.setHydrated(true);
      },
    },
  ),
);
