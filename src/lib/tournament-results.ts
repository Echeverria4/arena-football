import type { Campeonato, ClassificacaoItem, Jogo, Participante } from "@/types/tournament";

function buildEmptyClassification(participantes: Participante[]): ClassificacaoItem[] {
  return participantes.map((participante) => ({
    participanteId: participante.id,
    nome: participante.nome,
    time: participante.time,
    pontos: 0,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    saldo: 0,
  }));
}

function sortClassificacao(list: ClassificacaoItem[]) {
  return [...list].sort((current, next) => {
    if (next.pontos !== current.pontos) {
      return next.pontos - current.pontos;
    }

    if (next.saldo !== current.saldo) {
      return next.saldo - current.saldo;
    }

    if (next.golsPro !== current.golsPro) {
      return next.golsPro - current.golsPro;
    }

    if (next.vitorias !== current.vitorias) {
      return next.vitorias - current.vitorias;
    }

    return current.time.localeCompare(next.time);
  });
}

export function calculateVictoryRate(wins: number, played: number) {
  if (!played) {
    return 0;
  }

  return (wins / played) * 100;
}

function buildClassificacaoFromMatches(campeonato: Campeonato, matches: Jogo[]) {
  const table = new Map<string, ClassificacaoItem>(
    buildEmptyClassification(campeonato.participantes).map((entry) => [entry.participanteId, entry]),
  );

  matches.forEach((jogo) => {
      const mandante = table.get(jogo.mandanteId);
      const visitante = table.get(jogo.visitanteId);

      if (!mandante || !visitante) {
        return;
      }

      const golsMandante = jogo.placarMandante ?? 0;
      const golsVisitante = jogo.placarVisitante ?? 0;

      mandante.jogos += 1;
      visitante.jogos += 1;
      mandante.golsPro += golsMandante;
      mandante.golsContra += golsVisitante;
      visitante.golsPro += golsVisitante;
      visitante.golsContra += golsMandante;

      if (golsMandante > golsVisitante) {
        mandante.vitorias += 1;
        mandante.pontos += 3;
        visitante.derrotas += 1;
      } else if (golsVisitante > golsMandante) {
        visitante.vitorias += 1;
        visitante.pontos += 3;
        mandante.derrotas += 1;
      } else {
        mandante.empates += 1;
        visitante.empates += 1;
        mandante.pontos += 1;
        visitante.pontos += 1;
      }
    });

  const recalculated = Array.from(table.values()).map((entry) => ({
    ...entry,
    saldo: entry.golsPro - entry.golsContra,
  }));

  return sortClassificacao(recalculated);
}

function getFinishedMatches(campeonato: Campeonato) {
  return campeonato.rodadas.flat().filter(
    (jogo) =>
      jogo.status === "finalizado" &&
      jogo.placarMandante != null &&
      jogo.placarVisitante != null,
  );
}

export function getLatestFinishedRound(campeonato: Campeonato) {
  return getFinishedMatches(campeonato).reduce(
    (highestRound, jogo) => Math.max(highestRound, jogo.rodada),
    0,
  );
}

export function recomputeCampeonatoClassificacao(campeonato: Campeonato) {
  return buildClassificacaoFromMatches(campeonato, getFinishedMatches(campeonato));
}

export function recomputeCampeonatoClassificacaoUntilRound(
  campeonato: Campeonato,
  maxRound: number,
) {
  if (maxRound <= 0) {
    return buildEmptyClassification(campeonato.participantes);
  }

  return buildClassificacaoFromMatches(
    campeonato,
    getFinishedMatches(campeonato).filter((jogo) => jogo.rodada <= maxRound),
  );
}

export function saveCampeonatoMatchScore(
  campeonato: Campeonato,
  jogoId: string,
  placarMandante: number,
  placarVisitante: number,
) {
  const rodadas = campeonato.rodadas.map((rodada) =>
    rodada.map((jogo) =>
      jogo.id === jogoId
        ? ({
            ...jogo,
            placarMandante,
            placarVisitante,
            status: "finalizado",
          } satisfies Jogo)
        : jogo,
    ),
  );

  const allMatchesFinished = rodadas
    .flat()
    .every(
      (jogo) =>
        jogo.status === "finalizado" &&
        jogo.placarMandante != null &&
        jogo.placarVisitante != null,
    );

  const finishDate = allMatchesFinished
    ? campeonato.fimEm ?? new Date().toISOString()
    : undefined;

  return {
    ...campeonato,
    status: allMatchesFinished ? "finalizado" : campeonato.status,
    fimEm: finishDate,
    rodadas,
    classificacao: recomputeCampeonatoClassificacao({
      ...campeonato,
      status: allMatchesFinished ? "finalizado" : campeonato.status,
      fimEm: finishDate,
      rodadas,
    }),
  };
}
