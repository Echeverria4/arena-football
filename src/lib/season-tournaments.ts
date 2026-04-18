import type { Campeonato, ClassificacaoItem, Participante } from "@/types/tournament";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: string | undefined) {
  return new Date(value ?? new Date().toISOString());
}

function extractSeasonNumber(label?: string) {
  const matched = String(label ?? "").match(/(\d+)/);
  return matched ? Number(matched[1]) : 0;
}

function formatSeasonNumber(value: number) {
  return `Temporada ${String(value).padStart(2, "0")}`;
}

export function getSeasonStatus(campeonato: Campeonato) {
  return campeonato.status === "finalizado" ? "finalizado" : "ativo";
}

export function getNextSeasonLabel(campeonatos: Campeonato[]) {
  const nextNumber =
    campeonatos.reduce((highest, campeonato) => {
      return Math.max(highest, extractSeasonNumber(campeonato.temporada));
    }, 0) + 1;

  return formatSeasonNumber(nextNumber);
}

export function normalizeCampeonato(campeonato: Campeonato): Campeonato {
  return {
    ...campeonato,
    temporada: campeonato.temporada ?? formatSeasonNumber(1),
    status: getSeasonStatus(campeonato),
    tempoExtraRodadasMs: campeonato.tempoExtraRodadasMs ?? {},
    formato: campeonato.formato ?? "league",
    regras:
      campeonato.regras ??
      "Mandante cria a sala. Resultados podem ser corrigidos somente pelo criador.",
    criteriosClassificacao:
      campeonato.criteriosClassificacao ?? ["points", "goal_difference", "head_to_head"],
    allowVideos: campeonato.allowVideos ?? true,
    allowGoalAward: campeonato.allowGoalAward ?? true,
  };
}

export function sortCampeonatosBySeason(campeonatos: Campeonato[]) {
  return [...campeonatos]
    .map(normalizeCampeonato)
    .sort((current, next) => {
      const nextSeasonNumber = extractSeasonNumber(next.temporada);
      const currentSeasonNumber = extractSeasonNumber(current.temporada);

      if (nextSeasonNumber !== currentSeasonNumber) {
        return nextSeasonNumber - currentSeasonNumber;
      }

      return (
        toDate(next.inicioEm ?? next.criadoEm).getTime() -
        toDate(current.inicioEm ?? current.criadoEm).getTime()
      );
    });
}

export function getCurrentOrLatestCampeonato(campeonatos: Campeonato[], preferredId?: string) {
  const ordered = sortCampeonatosBySeason(campeonatos);
  const active = ordered.find((item) => item.status === "ativo");

  if (preferredId) {
    const preferred = ordered.find((item) => item.id === preferredId);
    if (preferred?.status === "ativo") {
      return preferred;
    }
  }

  return active ?? ordered[0] ?? null;
}

export function formatRoundDeadlineDays(days?: number | null) {
  if (!days || days < 1) {
    return "A definir";
  }

  return days === 1 ? "1 Dia" : `${days} Dias`;
}

export function getCampeonatoLeader(campeonato: Campeonato) {
  const top = getCampeonatoPodium(campeonato, 1)[0];

  const participant = campeonato.participantes.find((item) => item.id === top?.participanteId);

  return {
    classificacao: top ?? null,
    participante: participant ?? null,
  };
}

export function getCampeonatoSeasonLabel(campeonato: Campeonato) {
  return normalizeCampeonato(campeonato).temporada ?? formatSeasonNumber(1);
}

export function getCampeonatoPodium(campeonato: Campeonato, size = 3) {
  return [...campeonato.classificacao]
    .sort((current, next) => {
      if (next.pontos !== current.pontos) {
        return next.pontos - current.pontos;
      }

      if (next.saldo !== current.saldo) {
        return next.saldo - current.saldo;
      }

      return next.golsPro - current.golsPro;
    })
    .slice(0, size);
}

export function buildSeasonMetadata(campeonatos: Campeonato[], baseDate = new Date()) {
  const start = new Date(baseDate);

  return {
    inicioEm: start.toISOString(),
    temporada: getNextSeasonLabel(campeonatos),
  };
}

export function getParticipantTeam(participante?: Participante | null, classificacao?: ClassificacaoItem | null) {
  return participante?.time ?? classificacao?.time ?? "Time da temporada";
}

export function getRoundDeadline(campeonato: Campeonato, round: number) {
  const normalized = normalizeCampeonato(campeonato);

  if (normalized.prazoFinalEm) {
    return normalized.prazoFinalEm;
  }

  if (!normalized.inicioEm || !normalized.prazoRodadaDias) {
    return null;
  }

  const roundDays = Math.max(1, normalized.prazoRodadaDias);
  const baseDate = toDate(normalized.inicioEm);
  const extraTimeMs = normalized.tempoExtraRodadasMs?.[String(round)] ?? 0;

  return new Date(
    baseDate.getTime() + Math.max(0, round) * roundDays * DAY_MS + extraTimeMs,
  ).toISOString();
}
