import { teamCatalog, type TeamItem } from "@/lib/team-data";

export type TeamPoolPresetType = "club_league" | "national_teams";

export type TeamPoolPreset = {
  id: string;
  label: string;
  continentId: string;
  continentLabel: string;
  targetId: string;
  targetLabel: string;
  description: string;
  type: TeamPoolPresetType;
  teams: TeamItem[];
};

export type TeamPoolContinentOption = {
  id: string;
  label: string;
  subtitle: string;
};

export const teamPoolPresets: TeamPoolPreset[] = teamCatalog.flatMap((continent) => {
  const clubLeagues = continent.clubes.map((league) => ({
    id: `clubes:${continent.id}:${league.id}`,
    label: `${continent.nome} • ${league.nome}`,
    continentId: continent.id,
    continentLabel: continent.nome,
    targetId: league.id,
    targetLabel: league.nome,
    description: `Apenas clubes da ${league.nome}.`,
    type: "club_league" as const,
    teams: league.times,
  }));

  const nationalTeams = continent.selecoes.length
    ? [
        {
          id: `selecoes:${continent.id}`,
          label: `Seleções • ${continent.nome}`,
          continentId: continent.id,
          continentLabel: continent.nome,
          targetId: `selecoes:${continent.id}`,
          targetLabel: `Seleções ${continent.nome}`,
          description: `Apenas seleções da ${continent.nome}.`,
          type: "national_teams" as const,
          teams: continent.selecoes,
        },
      ]
    : [];

  return [...clubLeagues, ...nationalTeams];
});

export function getTeamPoolPresetById(id?: string | null) {
  if (!id) {
    return null;
  }

  return teamPoolPresets.find((preset) => preset.id === id) ?? null;
}

export const teamPoolContinents: TeamPoolContinentOption[] = teamCatalog
  .filter((continent) => continent.clubes.length > 0 || continent.selecoes.length > 0)
  .map((continent) => ({
    id: continent.id,
    label: continent.nome,
    subtitle: continent.subtitulo,
  }));

export function getTeamPoolPresetsByContinent(continentId?: string | null) {
  if (!continentId) {
    return [];
  }

  return teamPoolPresets.filter((preset) => preset.continentId === continentId);
}
