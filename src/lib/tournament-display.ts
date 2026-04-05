import {
  getRoundDeadline,
  getSeasonStatus,
  sortCampeonatosBySeason,
} from "@/lib/season-tournaments";
import { hydrateCampeonatoStructure } from "@/lib/tournament-setup";
import { recomputeCampeonatoClassificacao } from "@/lib/tournament-results";
import { resolveTeamVisualByName } from "@/lib/team-visuals";
import type {
  Campeonato,
  HistoricalPerformance,
  StandingEntry,
  Tournament,
  TournamentParticipant,
} from "@/types/tournament";
import type { Match } from "@/types/match";
import type { VideoHighlight } from "@/types/video";

export interface TournamentDisplayBundle {
  campeonato: Campeonato;
  tournament: Tournament;
  participants: TournamentParticipant[];
  standings: StandingEntry[];
  history: HistoricalPerformance[];
  matches: Match[];
  videos: VideoHighlight[];
}

export function getTournamentBundle(
  id: string | undefined,
  campeonatos: Campeonato[],
  storeVideos: VideoHighlight[],
): TournamentDisplayBundle | null {
  if (!id) {
    return null;
  }

  const campeonato = campeonatos.find((item) => item.id === id);

  if (!campeonato) {
    return null;
  }

  const normalizedCampeonato = hydrateCampeonatoStructure(campeonato);
  const standingsSource =
    normalizedCampeonato.classificacao.length > 0
      ? normalizedCampeonato.classificacao
      : recomputeCampeonatoClassificacao(normalizedCampeonato);
  const tournamentFormat = normalizedCampeonato.formato ?? "league";
  const phaseLabel =
    tournamentFormat === "knockout"
      ? "Mata-mata"
      : tournamentFormat === "league"
        ? "Pontos corridos"
        : "Fase de grupos";

  const participants: TournamentParticipant[] = normalizedCampeonato.participantes.map(
    (participant, index) => ({
      id: participant.id,
      tournamentId: normalizedCampeonato.id,
      userId: `campeonato-player-${index + 1}`,
      teamName: participant.time,
      groupName:
        participant.grupo ??
        (tournamentFormat === "groups" || tournamentFormat === "groups_knockout"
          ? "Grupo sem nome"
          : "Liga principal"),
      isOrganizer: index === 0,
      displayName: participant.nome,
      teamBadgeUrl: participant.timeImagem ?? resolveTeamVisualByName(participant.time) ?? null,
      stadiumImageUrl: null,
    }),
  );

  const standings: StandingEntry[] = standingsSource.map((entry) => ({
    participantId: entry.participanteId,
    played: entry.jogos,
    points: entry.pontos,
    wins: entry.vitorias,
    draws: entry.empates,
    losses: entry.derrotas,
    goalsFor: entry.golsPro,
    goalsAgainst: entry.golsContra,
    goalDifference: entry.saldo,
  }));

  const matches: Match[] = normalizedCampeonato.rodadas.flatMap((rodada) =>
    rodada.map((jogo) => ({
      id: jogo.id,
      tournamentId: normalizedCampeonato.id,
      round: jogo.rodada,
      phase: phaseLabel,
      homeParticipantId: jogo.mandanteId,
      awayParticipantId: jogo.visitanteId,
      homeGoals: jogo.placarMandante,
      awayGoals: jogo.placarVisitante,
      roomCreatorParticipantId: jogo.mandanteId,
      deadlineAt: getRoundDeadline(normalizedCampeonato, jogo.rodada),
      status: jogo.status === "finalizado" ? "finished" : "pending",
    })),
  );

  return {
    campeonato: normalizedCampeonato,
    tournament: {
      id: normalizedCampeonato.id,
      name: normalizedCampeonato.nome,
      format: tournamentFormat,
      matchMode: normalizedCampeonato.modoConfronto ?? "single_game",
      teamRule: normalizedCampeonato.regraTimes,
      status: getSeasonStatus(normalizedCampeonato) === "finalizado" ? "finished" : "in_progress",
      rules:
        normalizedCampeonato.regras ??
        "Mandante cria a sala. Resultados podem ser corrigidos somente pelo criador.",
      creatorId: "user-organizer",
      startDate: normalizedCampeonato.inicioEm ?? null,
      allowVideos: normalizedCampeonato.allowVideos ?? true,
      allowGoalAward: normalizedCampeonato.allowGoalAward ?? true,
      coverUrl: null,
      createdAt: normalizedCampeonato.criadoEm,
    },
    participants,
    standings,
    history: [],
    matches,
    videos: storeVideos
      .filter((video) => video.tournamentId === normalizedCampeonato.id)
      .map((video) => ({
        ...video,
        tournamentName: video.tournamentName ?? normalizedCampeonato.nome,
      })),
  };
}

export function getActiveCampeonatos(campeonatos: Campeonato[]) {
  const ordered = sortCampeonatosBySeason(campeonatos);
  const ativos = ordered.filter((item) => item.status === "ativo");

  if (ativos.length) {
    return ativos;
  }

  return ordered;
}
