import { CLUBES_POR_CONFEDERACAO } from "@/data/clubesPorConfederacao";
import { SELECOES_POR_CONFEDERACAO } from "@/data/selecoesPorConfederacao";
import { resolveTeamVisual, slugify } from "@/lib/team-visuals";

export type TeamMode = "clubes" | "selecoes";

export type TeamItem = {
  id: string;
  nome: string;
  imagem?: string;
  tipoIcone: "bandeira" | "escudo";
};

export type LeagueItem = {
  id: string;
  nome: string;
  times: TeamItem[];
};

export type ContinentItem = {
  id: string;
  nome: string;
  subtitulo: string;
  clubes: LeagueItem[];
  selecoes: TeamItem[];
};

const CONTINENT_META: Record<string, Pick<ContinentItem, "nome" | "subtitulo">> = {
  conmebol: {
    nome: "CONMEBOL",
    subtitulo: "América do Sul",
  },
  uefa: {
    nome: "UEFA",
    subtitulo: "Europa",
  },
  concacaf: {
    nome: "CONCACAF",
    subtitulo: "América do Norte, Central e Caribe",
  },
  caf: {
    nome: "CAF",
    subtitulo: "África",
  },
  afc: {
    nome: "AFC",
    subtitulo: "Ásia",
  },
};

function mapClubLeague(
  countryKey: string,
  bucket: { nome: string; times: readonly string[] },
): LeagueItem {
  return {
    id: countryKey,
    nome: bucket.nome,
    times: bucket.times.map((teamName) => ({
      id: slugify(teamName),
      nome: teamName,
      imagem: resolveTeamVisual({ nome: teamName, tipoIcone: "escudo" }),
      tipoIcone: "escudo",
    })),
  };
}

function mapSelection(bucket: { nome: string }) {
  return {
    id: slugify(bucket.nome),
    nome: bucket.nome,
    imagem: resolveTeamVisual({ nome: bucket.nome, tipoIcone: "bandeira" }),
    tipoIcone: "bandeira" as const,
  };
}

export const teamCatalog: ContinentItem[] = Object.entries(CONTINENT_META).map(
  ([continentId, meta]) => ({
    id: continentId,
    nome: meta.nome,
    subtitulo: meta.subtitulo,
    clubes: Object.entries(CLUBES_POR_CONFEDERACAO[continentId as keyof typeof CLUBES_POR_CONFEDERACAO] ?? {}).map(
      ([countryKey, bucket]) => mapClubLeague(countryKey, bucket),
    ),
    selecoes: Object.values(
      SELECOES_POR_CONFEDERACAO[continentId as keyof typeof SELECOES_POR_CONFEDERACAO] ?? {},
    ).map((bucket) => mapSelection(bucket)),
  }),
);
