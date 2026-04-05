import { normalizeCampeonato } from "@/lib/season-tournaments";
import { useTournamentStore } from "@/stores/tournament-store";
import type { Tournament } from "@/types/tournament";

export interface ActiveVideoTournament {
  id: string;
  name: string;
  createdAt: string;
  status: "active";
}

export async function listTournaments() {
  const campeonatos = useTournamentStore.getState().campeonatos;

  if (!campeonatos.length) {
    return [];
  }

  return campeonatos.map((campeonato): Tournament => ({
    id: campeonato.id,
    name: campeonato.nome,
    format: "league",
    teamRule: campeonato.regraTimes,
    status: campeonato.status === "finalizado" ? "finished" : "in_progress",
    rules: "Configurado no wizard do campeonato.",
    creatorId: "user-organizer",
    createdAt: campeonato.criadoEm,
    startDate: campeonato.inicioEm ?? campeonato.criadoEm,
    matchMode: campeonato.modoConfronto ?? "single_game",
    allowVideos: true,
    allowGoalAward: true,
    coverUrl: null,
  }));
}

export async function getTournamentById(id: string) {
  const campeonato = useTournamentStore.getState().campeonatos.find((item) => item.id === id);

  if (!campeonato) {
    return null;
  }

  return {
    id: campeonato.id,
    name: campeonato.nome,
    format: "league" as const,
    teamRule: campeonato.regraTimes,
    status: campeonato.status === "finalizado" ? "finished" : "in_progress",
    rules: "Configurado no wizard do campeonato.",
    creatorId: "user-organizer",
    createdAt: campeonato.criadoEm,
    startDate: campeonato.inicioEm ?? campeonato.criadoEm,
    matchMode: campeonato.modoConfronto ?? "single_game",
    allowVideos: true,
    allowGoalAward: true,
    coverUrl: null,
  };
}

export async function createTournament() {
  const campeonatos = useTournamentStore.getState().campeonatos;
  const latest = campeonatos[campeonatos.length - 1];

  if (!latest) {
    return null;
  }

  return {
    id: latest.id,
    name: latest.nome,
    format: "league" as const,
    teamRule: latest.regraTimes,
    status: latest.status === "finalizado" ? "finished" : "in_progress",
    rules: "Configurado no wizard do campeonato.",
    creatorId: "user-organizer",
    createdAt: latest.criadoEm,
    startDate: latest.inicioEm ?? latest.criadoEm,
    matchMode: latest.modoConfronto ?? "single_game",
    allowVideos: true,
    allowGoalAward: true,
    coverUrl: null,
  };
}

export async function listActiveTournamentsForVideos(): Promise<ActiveVideoTournament[]> {
  const tournaments = useTournamentStore
    .getState()
    .campeonatos.map((campeonato) => normalizeCampeonato(campeonato)).filter((campeonato) => campeonato.status === "ativo")
    .map((campeonato) => ({
      id: campeonato.id,
      name: campeonato.nome,
      createdAt: campeonato.inicioEm ?? campeonato.criadoEm,
      status: "active" as const,
    }))
    .sort((current, next) => Date.parse(next.createdAt) - Date.parse(current.createdAt));

  return tournaments;
}
