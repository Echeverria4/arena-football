import { normalizeCampeonato } from "@/lib/season-tournaments";
import { recomputeCampeonatoClassificacao, recomputeCampeonatoClassificacaoUntilRound } from "@/lib/tournament-results";
import type {
  Campeonato,
  ClassificationCriterion,
  ClassificacaoItem,
  Jogo,
  Participante,
  TournamentFormat,
  TournamentGroupAdvancementMode,
  TournamentMatchMode,
} from "@/types/tournament";

type BuildInitialCampeonatoArgs = {
  id: string;
  name: string;
  createdAt: string;
  seasonLabel: string;
  format: TournamentFormat;
  matchMode: TournamentMatchMode;
  rules: string;
  classificationCriteria: ClassificationCriterion[];
  allowVideos: boolean;
  allowGoalAward: boolean;
  playerCount: number;
  numGrupos?: number;
  modoConfrontoMataMata?: TournamentMatchMode;
  gruposClassificacaoModo?: TournamentGroupAdvancementMode;
};

type GroupBucket = {
  name: string;
  participants: Participante[];
};

function formatSequence(value: number) {
  return String(value).padStart(2, "0");
}

function createParticipant(index: number, groupName?: string): Participante {
  const label = formatSequence(index + 1);

  return {
    id: `participant-${label}`,
    nome: `Jogador ${label}`,
    time: `Time ${label}`,
    grupo: groupName,
  };
}

function buildParticipantsFromClassification(classificacao: ClassificacaoItem[]) {
  return classificacao.map((entry) => ({
    id: entry.participanteId,
    nome: entry.nome,
    time: entry.time,
  }));
}

function splitIntoGroups(playerCount: number, numGrupos?: number): GroupBucket[] {
  const safePlayerCount = Math.max(2, playerCount);
  const desiredGroupCount = numGrupos
    ? Math.min(numGrupos, safePlayerCount)
    : safePlayerCount <= 4 ? 1 : Math.min(8, Math.max(2, Math.ceil(safePlayerCount / 4)));
  const groupCount = Math.min(desiredGroupCount, safePlayerCount);

  const buckets = Array.from({ length: groupCount }, (_, index) => ({
    name: `Grupo ${String.fromCharCode(65 + index)}`,
    participants: [] as Participante[],
  }));

  for (let index = 0; index < safePlayerCount; index += 1) {
    const bucketIndex = index % groupCount;
    buckets[bucketIndex]?.participants.push(createParticipant(index, buckets[bucketIndex]?.name));
  }

  return buckets.filter((bucket) => bucket.participants.length > 0);
}

function buildLeagueParticipants(playerCount: number) {
  return Array.from({ length: Math.max(2, playerCount) }, (_, index) => createParticipant(index));
}

function createMatch(
  homeId: string,
  awayId: string,
  round: number,
  matchIndex: number,
): Jogo {
  return {
    id: `round-${formatSequence(round)}-match-${formatSequence(matchIndex)}`,
    rodada: round,
    mandanteId: homeId,
    visitanteId: awayId,
    placarMandante: null,
    placarVisitante: null,
    status: "pendente",
  };
}

function buildRoundRobinRounds(
  participantIds: string[],
  matchMode: TournamentMatchMode,
  roundOffset = 0,
  matchOffset = 0,
) {
  const ids = [...participantIds];

  if (ids.length < 2) {
    return { rounds: [] as Jogo[][], nextMatchOffset: matchOffset };
  }

  const hasBye = ids.length % 2 !== 0;
  if (hasBye) {
    ids.push("__bye__");
  }

  const totalSlots = ids.length;
  const totalRounds = totalSlots - 1;
  const half = totalSlots / 2;
  const rotation = [...ids];
  const rounds: Jogo[][] = [];
  let nextMatchOffset = matchOffset;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const matches: Jogo[] = [];

    for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
      const home = rotation[pairIndex];
      const away = rotation[totalSlots - 1 - pairIndex];

      if (!home || !away || home === "__bye__" || away === "__bye__") {
        continue;
      }

      matches.push(createMatch(home, away, roundOffset + roundIndex + 1, nextMatchOffset + 1));
      nextMatchOffset += 1;
    }

    rounds.push(matches);

    const fixed = rotation[0];
    const rotating = rotation.slice(1);
    rotating.unshift(rotating.pop()!);
    rotation.splice(0, rotation.length, fixed, ...rotating);
  }

  if (matchMode === "home_away") {
    const returnRounds = rounds.map((roundMatches, roundIndex) =>
      roundMatches.map((match) => {
        nextMatchOffset += 1;

        return createMatch(
          match.visitanteId,
          match.mandanteId,
          roundOffset + totalRounds + roundIndex + 1,
          nextMatchOffset,
        );
      }),
    );

    return { rounds: [...rounds, ...returnRounds], nextMatchOffset };
  }

  return { rounds, nextMatchOffset };
}

function combineGroupedRounds(groupedRounds: Jogo[][][]) {
  const totalRounds = Math.max(...groupedRounds.map((rounds) => rounds.length), 0);
  const combined: Jogo[][] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    combined.push(groupedRounds.flatMap((rounds) => rounds[roundIndex] ?? []));
  }

  return combined;
}

function buildInitialRounds(
  participants: Participante[],
  format: TournamentFormat,
  matchMode: TournamentMatchMode,
) {
  if (participants.length < 2) {
    return [] as Jogo[][];
  }

  if (format === "league") {
    return buildRoundRobinRounds(
      participants.map((participant) => participant.id),
      matchMode,
    ).rounds;
  }

  if (format === "knockout") {
    const firstRoundMatches: Jogo[] = [];
    let matchIndex = 0;

    for (let index = 0; index < participants.length - 1; index += 2) {
      matchIndex += 1;
      firstRoundMatches.push(createMatch(participants[index]!.id, participants[index + 1]!.id, 1, matchIndex));
    }

    if (matchMode === "home_away") {
      const returnLegs = firstRoundMatches.map((match, index) =>
        createMatch(match.visitanteId, match.mandanteId, 2, matchIndex + index + 1),
      );

      return [firstRoundMatches, returnLegs];
    }

    return [firstRoundMatches];
  }

  const groupedParticipants = Array.from(
    participants.reduce((map, participant) => {
      const groupName = participant.grupo ?? "Grupo A";
      const current = map.get(groupName) ?? [];
      map.set(groupName, [...current, participant]);
      return map;
    }, new Map<string, Participante[]>()),
  );

  const groupedRounds = groupedParticipants.map(([, groupParticipants], groupIndex) =>
    buildRoundRobinRounds(
      groupParticipants.map((participant) => participant.id),
      matchMode,
      0,
      groupIndex * 100,
    ).rounds,
  );

  return combineGroupedRounds(groupedRounds);
}

export function hasTournamentStructure(campeonato: Campeonato) {
  return campeonato.participantes.length > 0 && campeonato.rodadas.flat().length > 0;
}

export function hydrateCampeonatoStructure(campeonato: Campeonato) {
  const normalized = normalizeCampeonato(campeonato);
  const participants =
    normalized.participantes.length > 0
      ? normalized.participantes
      : buildParticipantsFromClassification(normalized.classificacao);

  let hydrated: Campeonato = {
    ...normalized,
    participantes: participants,
  };

  const hasRounds = hydrated.rodadas.some((round) => round.length > 0);

  if (!hasRounds && hydrated.classificacao.length === 0 && hydrated.participantes.length > 1) {
    hydrated = {
      ...hydrated,
      rodadas: buildInitialRounds(
        hydrated.participantes,
        hydrated.formato ?? "league",
        hydrated.modoConfronto ?? "single_game",
      ),
    };
  }

  if (hydrated.classificacao.length === 0 && hydrated.participantes.length > 0) {
    hydrated = {
      ...hydrated,
      classificacao: recomputeCampeonatoClassificacao(hydrated),
    };
  }

  return normalizeCampeonato(hydrated);
}

export function buildInitialCampeonato({
  id,
  name,
  createdAt,
  seasonLabel,
  format,
  matchMode,
  rules,
  classificationCriteria,
  allowVideos,
  allowGoalAward,
  playerCount,
  numGrupos,
  modoConfrontoMataMata,
  gruposClassificacaoModo,
}: BuildInitialCampeonatoArgs) {
  const participants =
    format === "groups" || format === "groups_knockout"
      ? splitIntoGroups(playerCount, numGrupos).flatMap((group) => group.participants)
      : buildLeagueParticipants(playerCount);

  const groupStageRounds =
    format === "groups_knockout"
      ? buildInitialRounds(participants, "groups", matchMode)
      : buildInitialRounds(participants, format, matchMode);

  const baseCampeonato: Campeonato = {
    id,
    nome: name.trim(),
    status: "ativo",
    criadoEm: createdAt,
    temporada: seasonLabel,
    formato: format,
    modoConfronto: matchMode,
    numGrupos: format === "groups_knockout" ? (numGrupos ?? 2) : undefined,
    modoConfrontoMataMata: format === "groups_knockout" ? (modoConfrontoMataMata ?? "single_game") : undefined,
    numRodadasGrupos: format === "groups_knockout" ? groupStageRounds.length : undefined,
    gruposClassificacaoModo: format === "groups_knockout" ? (gruposClassificacaoModo ?? "top_two") : undefined,
    regraTimes: { mode: "open" },
    regras: rules.trim(),
    criteriosClassificacao: classificationCriteria,
    allowVideos,
    allowGoalAward,
    participantes: participants,
    rodadas: groupStageRounds,
    classificacao: [],
  };

  return hydrateCampeonatoStructure(baseCampeonato);
}

// ── Knockout phase generation ─────────────────────────────────────────────────

function rankGroupParticipants(campeonato: Campeonato, groupParticipantIds: Set<string>, untilRound: number) {
  const standings = recomputeCampeonatoClassificacaoUntilRound(campeonato, untilRound);
  return standings
    .filter((entry) => groupParticipantIds.has(entry.participanteId))
    .map((entry) => entry.participanteId);
}

export type KnockoutFirstRoundResult = {
  rounds: Jogo[][];
  classificadosDiretosIds?: string[];
};

/**
 * Generates the first knockout round based on group standings.
 * Behavior depends on campeonato.gruposClassificacaoModo:
 *   "first_only"                   → 1st of each group → direct bracket (1A vs 1B, 1C vs 1D…)
 *   "top_two" (default)            → World Cup bracket (1A vs 2B, 1B vs 2A…)
 *   "first_direct_second_playoff"  → Repescagem (2nd vs 2nd), 1st teams stored as direct qualifiers
 */
export function generateKnockoutFirstRound(campeonato: Campeonato): KnockoutFirstRoundResult {
  const numRodadasGrupos = campeonato.numRodadasGrupos ?? 0;
  const matchMode = campeonato.modoConfrontoMataMata ?? "single_game";
  const advancementMode = campeonato.gruposClassificacaoModo ?? "top_two";

  // Build group map and rankings
  const groupMap = new Map<string, Set<string>>();
  for (const p of campeonato.participantes) {
    const g = p.grupo ?? "Grupo A";
    if (!groupMap.has(g)) groupMap.set(g, new Set());
    groupMap.get(g)!.add(p.id);
  }
  const groupNames = Array.from(groupMap.keys()).sort();
  const groupRankings = new Map<string, string[]>();
  for (const g of groupNames) {
    groupRankings.set(g, rankGroupParticipants(campeonato, groupMap.get(g)!, numRodadasGrupos));
  }

  const newRoundNum = campeonato.rodadas.length + 1;
  let matchOffset = campeonato.rodadas.flat().length;

  function buildLegs(matches: Jogo[]): Jogo[][] {
    if (matchMode === "home_away") {
      const returnRound = matches.map((m) =>
        createMatch(m.visitanteId, m.mandanteId, newRoundNum + 1, ++matchOffset),
      );
      return [matches, returnRound];
    }
    return [matches];
  }

  // ── Mode: só o primeiro de cada grupo ──────────────────────────────────────
  if (advancementMode === "first_only") {
    const firsts = groupNames.map((g) => groupRankings.get(g)?.[0]).filter(Boolean) as string[];
    const matches: Jogo[] = [];
    for (let i = 0; i + 1 < firsts.length; i += 2) {
      matches.push(createMatch(firsts[i]!, firsts[i + 1]!, newRoundNum, ++matchOffset));
    }
    return { rounds: buildLegs(matches) };
  }

  // ── Mode: os dois primeiros (World Cup) ─────────────────────────────────────
  if (advancementMode === "top_two") {
    const firstLeg: Jogo[] = [];
    for (let i = 0; i < groupNames.length; i += 2) {
      const nameA = groupNames[i]!;
      const nameB = groupNames[i + 1];
      const rankA = groupRankings.get(nameA) ?? [];
      const rankB = nameB ? (groupRankings.get(nameB) ?? []) : [];
      if (rankA[0] && rankB[1]) firstLeg.push(createMatch(rankA[0], rankB[1], newRoundNum, ++matchOffset));
      if (nameB && rankB[0] && rankA[1]) firstLeg.push(createMatch(rankB[0], rankA[1], newRoundNum, ++matchOffset));
    }
    return { rounds: buildLegs(firstLeg) };
  }

  // ── Mode: 1º direto, 2º para repescagem ────────────────────────────────────
  if (advancementMode === "first_direct_second_playoff") {
    const firsts = groupNames.map((g) => groupRankings.get(g)?.[0]).filter(Boolean) as string[];
    const seconds = groupNames.map((g) => groupRankings.get(g)?.[1]).filter(Boolean) as string[];
    const repescagemMatches: Jogo[] = [];
    for (let i = 0; i + 1 < seconds.length; i += 2) {
      repescagemMatches.push(createMatch(seconds[i]!, seconds[i + 1]!, newRoundNum, ++matchOffset));
    }
    return {
      rounds: buildLegs(repescagemMatches),
      classificadosDiretosIds: firsts,
    };
  }

  // ── Mode: 1º direto, 2º × 3º de outro grupo na repescagem ─────────────────
  const firsts = groupNames.map((g) => groupRankings.get(g)?.[0]).filter(Boolean) as string[];
  const repescagemMatches: Jogo[] = [];
  for (let i = 0; i < groupNames.length; i += 2) {
    const nameA = groupNames[i]!;
    const nameB = groupNames[i + 1];
    const rankA = groupRankings.get(nameA) ?? [];
    const rankB = nameB ? (groupRankings.get(nameB) ?? []) : [];
    // 2º de A vs 3º de B
    if (rankA[1] && rankB[2]) repescagemMatches.push(createMatch(rankA[1], rankB[2], newRoundNum, ++matchOffset));
    // 2º de B vs 3º de A
    if (nameB && rankB[1] && rankA[2]) repescagemMatches.push(createMatch(rankB[1], rankA[2], newRoundNum, ++matchOffset));
  }
  return {
    rounds: buildLegs(repescagemMatches),
    classificadosDiretosIds: firsts,
  };
}

/**
 * Generates the next knockout round based on winners of the last knockout round.
 * For "first_direct_second_playoff": after repescagem finishes, combines direct qualifiers
 * with repescagem winners to form the main bracket.
 * Returns { rounds, clearDiretos } — clearDiretos=true means classificadosDiretosIds should be cleared.
 */
export type NextKnockoutRoundResult = { rounds: Jogo[][]; clearDiretos: boolean };

export function generateNextKnockoutRound(campeonato: Campeonato): NextKnockoutRoundResult {
  const numRodadasGrupos = campeonato.numRodadasGrupos ?? 0;
  const matchMode = campeonato.modoConfrontoMataMata ?? "single_game";
  const allRounds = campeonato.rodadas;
  const knockoutRounds = allRounds.slice(numRodadasGrupos);

  if (knockoutRounds.length === 0) return { rounds: [], clearDiretos: false };

  // Determine winners from last knockout stage
  const winners: string[] = [];

  if (matchMode === "home_away" && knockoutRounds.length >= 2) {
    const leg1 = knockoutRounds[knockoutRounds.length - 2]!;
    const leg2 = knockoutRounds[knockoutRounds.length - 1]!;
    for (const match of leg1) {
      const ret = leg2.find((m) => m.mandanteId === match.visitanteId && m.visitanteId === match.mandanteId);
      if (!ret) continue;
      const totalHome = (match.placarMandante ?? 0) + (ret.placarVisitante ?? 0);
      const totalAway = (match.placarVisitante ?? 0) + (ret.placarMandante ?? 0);
      winners.push(totalHome >= totalAway ? match.mandanteId : match.visitanteId);
    }
  } else {
    const lastRound = knockoutRounds[knockoutRounds.length - 1]!;
    for (const match of lastRound) {
      winners.push((match.placarMandante ?? 0) >= (match.placarVisitante ?? 0) ? match.mandanteId : match.visitanteId);
    }
  }

  // If we have direct qualifiers (repescagem mode), combine them with repescagem winners
  const diretos = campeonato.classificadosDiretosIds ?? [];
  const allAdvancing = diretos.length > 0 ? [...diretos, ...winners] : winners;
  const clearDiretos = diretos.length > 0;

  if (allAdvancing.length < 2) return { rounds: [], clearDiretos: false };

  const nextRoundNum = allRounds.length + 1;
  let matchOffset = allRounds.flat().length;
  const nextMatches: Jogo[] = [];

  for (let i = 0; i + 1 < allAdvancing.length; i += 2) {
    nextMatches.push(createMatch(allAdvancing[i]!, allAdvancing[i + 1]!, nextRoundNum, ++matchOffset));
  }

  if (matchMode === "home_away") {
    const returnRound = nextMatches.map((m) =>
      createMatch(m.visitanteId, m.mandanteId, nextRoundNum + 1, ++matchOffset),
    );
    return { rounds: [nextMatches, returnRound], clearDiretos };
  }

  return { rounds: [nextMatches], clearDiretos };
}
