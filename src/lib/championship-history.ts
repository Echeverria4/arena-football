import {
  getCampeonatoLeader,
  normalizeCampeonato,
  sortCampeonatosBySeason,
} from "@/lib/season-tournaments";
import { normalizeTeamDisplayName } from "@/lib/team-visuals";
import type { Campeonato } from "@/types/tournament";
import type { VideoHighlight } from "@/types/video";

export interface ChampionshipHistoryEntry {
  campeonato: Campeonato;
  championPlayerName: string;
  championTeamName: string;
  points: number;
  wins: number;
  goalDifference: number;
  played: number;
  videosCount: number;
}

export interface TitleLeaderboardEntry {
  id: string;
  label: string;
  subtitle: string;
  titles: number;
  seasons: string[];
  latestSeason: string;
}

function buildHistoryEntry(campeonato: Campeonato, videos: VideoHighlight[]): ChampionshipHistoryEntry {
  const normalized = normalizeCampeonato(campeonato);
  const leader = getCampeonatoLeader(normalized);
  const championName = leader.participante?.nome ?? leader.classificacao?.nome ?? "A definir";
  const championTeam = normalizeTeamDisplayName(
    leader.participante?.time ?? leader.classificacao?.time ?? normalized.nome,
  );

  return {
    campeonato: normalized,
    championPlayerName: championName,
    championTeamName: championTeam,
    points: leader.classificacao?.pontos ?? 0,
    wins: leader.classificacao?.vitorias ?? 0,
    goalDifference: leader.classificacao?.saldo ?? 0,
    played: leader.classificacao?.jogos ?? 0,
    videosCount: videos.filter((video) => video.tournamentId === normalized.id).length,
  };
}

export function getFinishedChampionshipHistory(
  campeonatos: Campeonato[],
  videos: VideoHighlight[] = [],
) {
  return sortCampeonatosBySeason(campeonatos)
    .filter((campeonato) => normalizeCampeonato(campeonato).status === "finalizado")
    .map((campeonato) => buildHistoryEntry(campeonato, videos));
}

export function getPlayerTitleLeaderboard(campeonatos: Campeonato[]) {
  const history = getFinishedChampionshipHistory(campeonatos);
  const map = new Map<string, TitleLeaderboardEntry>();

  history.forEach((entry) => {
    const key = entry.championPlayerName.trim().toLowerCase();
    const current = map.get(key);

    if (!current) {
      map.set(key, {
        id: `player-${key.replace(/\s+/g, "-")}`,
        label: entry.championPlayerName,
        subtitle: entry.championTeamName,
        titles: 1,
        seasons: [entry.campeonato.temporada ?? "Temporada atual"],
        latestSeason: entry.campeonato.temporada ?? "Temporada atual",
      });
      return;
    }

    current.titles += 1;
    current.seasons.push(entry.campeonato.temporada ?? "Temporada atual");
  });

  return [...map.values()].sort((current, next) => {
    if (next.titles !== current.titles) {
      return next.titles - current.titles;
    }

    return current.label.localeCompare(next.label);
  });
}

export function getTeamTitleLeaderboard(campeonatos: Campeonato[]) {
  const history = getFinishedChampionshipHistory(campeonatos);
  const map = new Map<string, TitleLeaderboardEntry>();

  history.forEach((entry) => {
    const key = entry.championTeamName.trim().toLowerCase();
    const current = map.get(key);

    if (!current) {
      map.set(key, {
        id: `team-${key.replace(/\s+/g, "-")}`,
        label: entry.championTeamName,
        subtitle: entry.championPlayerName,
        titles: 1,
        seasons: [entry.campeonato.temporada ?? "Temporada atual"],
        latestSeason: entry.campeonato.temporada ?? "Temporada atual",
      });
      return;
    }

    current.titles += 1;
    current.seasons.push(entry.campeonato.temporada ?? "Temporada atual");
  });

  return [...map.values()].sort((current, next) => {
    if (next.titles !== current.titles) {
      return next.titles - current.titles;
    }

    return current.label.localeCompare(next.label);
  });
}
