export type TournamentFormat =
  | "league"
  | "groups"
  | "knockout"
  | "groups_knockout";

export type TournamentGroupAdvancementMode =
  | "first_only"
  | "top_two"
  | "first_direct_second_playoff"
  | "first_direct_second_vs_third_playoff";
export type ClassificationCriterion =
  | "points"
  | "goal_difference"
  | "goals_for"
  | "wins"
  | "draws"
  | "losses"
  | "head_to_head";
export type TournamentMatchMode = "single_game" | "home_away";
export type TournamentTeamRuleMode = "open" | "preset";
export type TournamentTeamRuleType = "club_league" | "national_teams";

export type TournamentStatus = "draft" | "in_progress" | "finished";

export interface TournamentTeamRule {
  mode: TournamentTeamRuleMode;
  presetId?: string | null;
  presetLabel?: string | null;
  presetType?: TournamentTeamRuleType | null;
  continentId?: string | null;
  continentLabel?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  allowedTeamNames?: string[];
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  matchMode?: TournamentMatchMode;
  teamRule?: TournamentTeamRule;
  status: TournamentStatus;
  rules: string;
  creatorId: string;
  startDate?: string | null;
  allowVideos: boolean;
  allowGoalAward: boolean;
  coverUrl?: string | null;
  createdAt: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  teamName: string;
  groupName?: string | null;
  isOrganizer?: boolean;
  displayName: string;
  phone?: string | null;
  teamBadgeUrl?: string | null;
  stadiumImageUrl?: string | null;
}

export interface StandingEntry {
  participantId: string;
  played: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface HistoricalPerformance {
  userId: string;
  championshipsPlayed: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  titles: number;
}

export type Participante = {
  id: string;
  nome: string;
  time: string;
  grupo?: string;
  whatsapp?: string;
  timeImagem?: string;
  timeTipoIcone?: "bandeira" | "escudo";
};

export type Jogo = {
  id: string;
  rodada: number;
  mandanteId: string;
  visitanteId: string;
  placarMandante: number | null;
  placarVisitante: number | null;
  status: "pendente" | "finalizado";
};

export type ClassificacaoItem = {
  participanteId: string;
  nome: string;
  time: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
};

export type Campeonato = {
  id: string;
  nome: string;
  status: "ativo" | "finalizado";
  criadoEm: string;
  inicioEm?: string;
  fimEm?: string;
  temporada?: string;
  prazoRodadaDias?: number;
  prazoFinalEm?: string;
  tempoExtraRodadasMs?: Record<string, number>;
  formato?: TournamentFormat;
  modoConfronto?: TournamentMatchMode;
  /** Número de grupos para formato groups_knockout */
  numGrupos?: number;
  /** Modo das partidas da fase mata-mata (para groups_knockout) */
  modoConfrontoMataMata?: TournamentMatchMode;
  /** Quantas rodadas pertencem à fase de grupos (rodadas acima = mata-mata) */
  numRodadasGrupos?: number;
  /** Regra de classificação dos grupos para o mata-mata */
  gruposClassificacaoModo?: TournamentGroupAdvancementMode;
  /** IDs dos classificados diretos aguardando repescagem (modo first_direct_second_playoff) */
  classificadosDiretosIds?: string[];
  regraTimes?: TournamentTeamRule;
  regras?: string;
  criteriosClassificacao?: ClassificationCriterion[];
  allowVideos?: boolean;
  allowGoalAward?: boolean;
  participantes: Participante[];
  rodadas: Jogo[][];
  classificacao: ClassificacaoItem[];
};
