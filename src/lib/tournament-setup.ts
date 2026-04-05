import { normalizeCampeonato } from "@/lib/season-tournaments";
import { recomputeCampeonatoClassificacao } from "@/lib/tournament-results";
import type {
  Campeonato,
  ClassificationCriterion,
  ClassificacaoItem,
  Jogo,
  Participante,
  TournamentFormat,
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

function splitIntoGroups(playerCount: number): GroupBucket[] {
  const safePlayerCount = Math.max(2, playerCount);
  const desiredGroupCount =
    safePlayerCount <= 4 ? 1 : Math.min(8, Math.max(2, Math.ceil(safePlayerCount / 4)));
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
}: BuildInitialCampeonatoArgs) {
  const participants =
    format === "groups" || format === "groups_knockout"
      ? splitIntoGroups(playerCount).flatMap((group) => group.participants)
      : buildLeagueParticipants(playerCount);
  const baseCampeonato: Campeonato = {
    id,
    nome: name.trim(),
    status: "ativo",
    criadoEm: createdAt,
    temporada: seasonLabel,
    formato: format,
    modoConfronto: matchMode,
    regraTimes: { mode: "open" },
    regras: rules.trim(),
    criteriosClassificacao: classificationCriteria,
    allowVideos,
    allowGoalAward,
    participantes: participants,
    rodadas: buildInitialRounds(participants, format, matchMode),
    classificacao: [],
  };

  return hydrateCampeonatoStructure(baseCampeonato);
}
