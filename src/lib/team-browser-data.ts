import { teamCatalog } from "@/lib/team-data";
import type { TeamsByConfederationData } from "@/types/team-browser";

function mapClubCatalog(): TeamsByConfederationData {
  return Object.fromEntries(
    teamCatalog.map((continent) => [
      continent.id,
      Object.fromEntries(
        continent.clubes.map((league) => [
          league.id,
          {
            nome: league.nome,
            times: league.times.map((team) => ({
              id: team.id,
              nome: team.nome,
              imagem: team.imagem,
              tipoIcone: team.tipoIcone,
            })),
          },
        ]),
      ),
    ]),
  );
}

function mapSelectionCatalog(): TeamsByConfederationData {
  return Object.fromEntries(
    teamCatalog.map((continent) => [
      continent.id,
      Object.fromEntries(
        continent.selecoes.map((team) => [
          team.id,
          {
            nome: team.nome,
            imagem: team.imagem,
            tipoIcone: team.tipoIcone,
            times: [
              {
                id: team.id,
                nome: team.nome,
                imagem: team.imagem,
                tipoIcone: team.tipoIcone,
              },
            ],
          },
        ]),
      ),
    ]),
  );
}

export const CLUBES_DO_CATALOGO = mapClubCatalog();
export const SELECOES_DO_CATALOGO = mapSelectionCatalog();
