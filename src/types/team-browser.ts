import type { TeamVisualKind } from "@/lib/team-visuals";

export type TeamBrowserItem = {
  id?: string;
  nome: string;
  link?: string;
  imagem?: string;
  tipoIcone?: TeamVisualKind;
};

export type TeamBrowserBucket = {
  nome: string;
  imagem?: string;
  tipoIcone?: TeamVisualKind;
  times: readonly (TeamBrowserItem | string)[];
};

export type TeamsByConfederationData = Record<string, Record<string, TeamBrowserBucket>>;
