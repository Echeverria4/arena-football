import { getRoundDeadline, normalizeCampeonato } from "@/lib/season-tournaments";
import { recomputeCampeonatoClassificacao } from "@/lib/tournament-results";
import { hydrateCampeonatoStructure } from "@/lib/tournament-setup";
import type { Campeonato, Jogo } from "@/types/tournament";

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

function buildFinishedRoundMatch(jogo: Jogo): Jogo {
  return {
    ...jogo,
    placarMandante: jogo.placarMandante ?? 0,
    placarVisitante: jogo.placarVisitante ?? 0,
    status: "finalizado",
  };
}

export function getCurrentOpenRound(campeonato: Campeonato) {
  const normalized = normalizeCampeonato(campeonato);

  for (const rodada of normalized.rodadas) {
    const pendingMatch = rodada.find((jogo) => jogo.status !== "finalizado");

    if (pendingMatch) {
      return pendingMatch.rodada;
    }
  }

  return null;
}

export function getRoundExtraTimeMs(campeonato: Campeonato, round: number) {
  return normalizeCampeonato(campeonato).tempoExtraRodadasMs?.[String(round)] ?? 0;
}

export function getCountdownParts(totalMs: number) {
  const safeMs = Math.max(0, totalMs);
  const totalSeconds = Math.floor(safeMs / SECOND_MS);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalMs: safeMs,
    days,
    hours,
    minutes,
    seconds,
  };
}

export function getRoundDeadlineCountdown(
  campeonato: Campeonato,
  round: number,
  now = new Date(),
) {
  const deadlineAt = getRoundDeadline(campeonato, round);

  if (!deadlineAt) {
    return null;
  }

  const remainingMs = new Date(deadlineAt).getTime() - now.getTime();

  return {
    round,
    deadlineAt,
    remainingMs,
    expired: remainingMs <= 0,
    extraTimeMs: getRoundExtraTimeMs(campeonato, round),
    ...getCountdownParts(remainingMs),
  };
}

export function syncExpiredCampeonatoRounds(campeonato: Campeonato, now = new Date()) {
  const normalized = normalizeCampeonato(campeonato);
  let changed = false;

  const updatedRounds = normalized.rodadas.map((rodada, roundIndex) => {
    const roundNumber = rodada[0]?.rodada ?? roundIndex + 1;
    const deadlineAt = getRoundDeadline(normalized, roundNumber);

    if (!deadlineAt || new Date(deadlineAt).getTime() > now.getTime()) {
      return rodada;
    }

    return rodada.map((jogo) => {
      if (jogo.status === "finalizado") {
        return jogo;
      }

      changed = true;
      return buildFinishedRoundMatch(jogo);
    });
  });

  if (!changed) {
    return {
      changed: false,
      campeonato: normalized,
    };
  }

  const allMatchesFinished = updatedRounds.flat().every(
    (jogo) =>
      jogo.status === "finalizado" &&
      jogo.placarMandante != null &&
      jogo.placarVisitante != null,
  );

  const nextCampeonato = hydrateCampeonatoStructure({
    ...normalized,
    status: allMatchesFinished ? "finalizado" : normalized.status,
    fimEm: allMatchesFinished ? normalized.fimEm ?? now.toISOString() : normalized.fimEm,
    rodadas: updatedRounds,
    classificacao: recomputeCampeonatoClassificacao({
      ...normalized,
      rodadas: updatedRounds,
    }),
  });

  return {
    changed: true,
    campeonato: nextCampeonato,
  };
}
