import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { HOUR_MS, syncExpiredCampeonatoRounds } from "@/lib/tournament-deadlines";
import { expireTournamentSharesByTournamentId } from "@/lib/tournament-sharing";
import { saveCampeonatoMatchScore } from "@/lib/tournament-results";
import { hydrateCampeonatoStructure } from "@/lib/tournament-setup";
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
  atualizarCampeonato: (id: string, patch: Partial<Campeonato>) => void;
  salvarPlacarJogo: (
    campeonatoId: string,
    jogoId: string,
    placarMandante: number,
    placarVisitante: number,
  ) => void;
  ajustarTempoExtraRodada: (campeonatoId: string, rodada: number, deltaMs: number) => void;
  sincronizarPrazosRodadas: (now?: string) => void;
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
      atualizarCampeonato: (id, patch) => {
        let shouldExpireShares = false;

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
            }

            return updatedCampeonato;
          }),
          selectedCampeonato:
            state.selectedCampeonato?.id === id
              ? hydrateCampeonatoStructure({ ...state.selectedCampeonato, ...patch })
              : state.selectedCampeonato,
        }));

        if (shouldExpireShares) {
          void expireTournamentSharesByTournamentId(id);
        }
      },
      salvarPlacarJogo: (campeonatoId, jogoId, placarMandante, placarVisitante) => {
        let shouldExpireShares = false;

        set((state) => {
          const updateCampeonato = (campeonato: Campeonato) =>
            {
              if (campeonato.id !== campeonatoId) {
                return campeonato;
              }

              const updatedCampeonato = hydrateCampeonatoStructure(
                saveCampeonatoMatchScore(campeonato, jogoId, placarMandante, placarVisitante),
              );

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
      },
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
