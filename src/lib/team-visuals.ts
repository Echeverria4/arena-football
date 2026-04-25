import { Image, type ImageSourcePropType } from "react-native";

function localBadge(asset: number) {
  return Image.resolveAssetSource(asset).uri;
}

export type TeamVisualKind = "bandeira" | "escudo";

const TEAM_DISPLAY_ALIASES: Record<string, string> = {
  corintios: "Corinthians",
  corinthians: "Corinthians",
};

const CONFEDERATION_ICON_SOURCES: Record<string, { gray: ImageSourcePropType; color: ImageSourcePropType }> = {
  conmebol: {
    gray: require("../../assets/conf/conmebol-gray.png"),
    color: require("../../assets/conf/conmebol-color.png"),
  },
  uefa: {
    gray: require("../../assets/conf/uefa-gray.png"),
    color: require("../../assets/conf/uefa-color.png"),
  },
  concacaf: {
    gray: require("../../assets/conf/concacaf-gray.png"),
    color: require("../../assets/conf/concacaf-color.png"),
  },
  caf: {
    gray: require("../../assets/conf/caf-gray.png"),
    color: require("../../assets/conf/caf-color.png"),
  },
  afc: {
    gray: require("../../assets/conf/afc-gray.png"),
    color: require("../../assets/conf/afc-color.png"),
  },
};

const SELECTION_FLAG_URLS: Record<string, string> = {
  argentina: "https://flagcdn.com/w160/ar.png",
  bolivia: "https://flagcdn.com/w160/bo.png",
  brasil: "https://flagcdn.com/w160/br.png",
  chile: "https://flagcdn.com/w160/cl.png",
  colombia: "https://flagcdn.com/w160/co.png",
  equador: "https://flagcdn.com/w160/ec.png",
  paraguai: "https://flagcdn.com/w160/py.png",
  peru: "https://flagcdn.com/w160/pe.png",
  uruguai: "https://flagcdn.com/w160/uy.png",
  alemanha: "https://flagcdn.com/w160/de.png",
  austria: "https://flagcdn.com/w160/at.png",
  belgica: "https://flagcdn.com/w160/be.png",
  croacia: "https://flagcdn.com/w160/hr.png",
  dinamarca: "https://flagcdn.com/w160/dk.png",
  escocia: "https://flagcdn.com/w160/gb-sct.png",
  eslovaquia: "https://flagcdn.com/w160/sk.png",
  eslovenia: "https://flagcdn.com/w160/si.png",
  espanha: "https://flagcdn.com/w160/es.png",
  franca: "https://flagcdn.com/w160/fr.png",
  "pais-de-gales": localBadge(require("../../assets/badges/pais-de-gales.png")),
  grecia: "https://flagcdn.com/w160/gr.png",
  hungria: "https://flagcdn.com/w160/hu.png",
  inglaterra: "https://flagcdn.com/w160/gb-eng.png",
  irlanda: "https://flagcdn.com/w160/ie.png",
  italia: "https://flagcdn.com/w160/it.png",
  holanda: "https://flagcdn.com/w160/nl.png",
  "paises-baixos": "https://flagcdn.com/w160/nl.png",
  polonia: "https://flagcdn.com/w160/pl.png",
  portugal: "https://flagcdn.com/w160/pt.png",
  "republica-tcheca": "https://flagcdn.com/w160/cz.png",
  romenia: "https://flagcdn.com/w160/ro.png",
  russia: "https://flagcdn.com/w160/ru.png",
  servia: "https://flagcdn.com/w160/rs.png",
  suecia: "https://flagcdn.com/w160/se.png",
  suica: "https://flagcdn.com/w160/ch.png",
  turquia: "https://flagcdn.com/w160/tr.png",
  ucrania: "https://flagcdn.com/w160/ua.png",
  canada: "https://flagcdn.com/w160/ca.png",
  "costa-rica": "https://flagcdn.com/w160/cr.png",
  "estados-unidos": "https://flagcdn.com/w160/us.png",
  mexico: "https://flagcdn.com/w160/mx.png",
  "africa-do-sul": "https://flagcdn.com/w160/za.png",
  argelia: "https://flagcdn.com/w160/dz.png",
  egito: "https://flagcdn.com/w160/eg.png",
  marrocos: "https://flagcdn.com/w160/ma.png",
  nigeria: "https://flagcdn.com/w160/ng.png",
  senegal: "https://flagcdn.com/w160/sn.png",
  japao: "https://flagcdn.com/w160/jp.png",
  "coreia-do-sul": "https://flagcdn.com/w160/kr.png",
  australia: "https://flagcdn.com/w160/au.png",
  "arabia-saudita": "https://flagcdn.com/w160/sa.png",
  ira: "https://flagcdn.com/w160/ir.png",
  catar: "https://flagcdn.com/w160/qa.png",
  china: "https://flagcdn.com/w160/cn.png",
  "taipe-chines": localBadge(require("../../assets/badges/taipe-chines.png")),
  "emirados-arabes-unidos": "https://flagcdn.com/w160/ae.png",
};

const CLUB_BADGE_URLS: Record<string, string> = {
  "boca-juniors":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Boca_Juniors_logo.svg/512px-Boca_Juniors_logo.svg.png",
  "river-plate":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Club_Atl%C3%A9tico_River_Plate_logo.svg/512px-Club_Atl%C3%A9tico_River_Plate_logo.svg.png",
  estudiantes:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/25/Estudiantes_de_La_Plata_logo.svg/512px-Estudiantes_de_La_Plata_logo.svg.png",
  independiente:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/45/Club_Atl%C3%A9tico_Independiente_logo.svg/512px-Club_Atl%C3%A9tico_Independiente_logo.svg.png",
  racing:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Escudo_de_Racing_Club.svg/512px-Escudo_de_Racing_Club.svg.png",
  "arsenal-de-sarandi":
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Arsenal_de_Sarand%C3%AD_logo.svg/512px-Arsenal_de_Sarand%C3%AD_logo.svg.png",
  "velez-sarsfield":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Logo_V%C3%A9lez.svg/512px-Logo_V%C3%A9lez.svg.png",
  corinthians:
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/S.C._Corinthians_Paulista_Logo.svg/512px-S.C._Corinthians_Paulista_Logo.svg.png",
  palmeiras:
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Sociedade_Esportiva_Palmeiras_logo.svg/512px-Sociedade_Esportiva_Palmeiras_logo.svg.png",
  "sao-paulo":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_S%C3%A3o_Paulo_FC.svg/512px-Logo_S%C3%A3o_Paulo_FC.svg.png",
  santos:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_Logo.png/512px-Santos_Logo.png",
  flamengo:
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/16/Clube_de_Regatas_do_Flamengo_logo.svg/512px-Clube_de_Regatas_do_Flamengo_logo.svg.png",
  vasco:
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/CR_Vasco_da_Gama_2020_logo.svg/512px-CR_Vasco_da_Gama_2020_logo.svg.png",
  cruzeiro:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Escudo_Cruzeiro_Esporte_Clube.svg/512px-Escudo_Cruzeiro_Esporte_Clube.svg.png",
  internacional:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/SC_Internacional_Brazil_Logo.svg/512px-SC_Internacional_Brazil_Logo.svg.png",
  bragantino:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/26/Red_Bull_Bragantino_logo.svg/512px-Red_Bull_Bragantino_logo.svg.png",
  chelsea:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/512px-Chelsea_FC.svg.png",
  "manchester-united":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/512px-Manchester_United_FC_crest.svg.png",
  "young-boys":
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/BSC_Young_Boys.svg/512px-BSC_Young_Boys.svg.png",
  borussia:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/512px-Borussia_Dortmund_logo.svg.png",
};

export function slugify(value: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTeamInitials(name: string) {
  const parts = normalizeTeamDisplayName(name)
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "TM";
}

export function getConfederationIcon(confederationId: string, variant: "gray" | "color" = "gray") {
  return CONFEDERATION_ICON_SOURCES[slugify(confederationId)]?.[variant];
}

export function resolveTeamVisual(input: {
  id?: string;
  nome?: string;
  imagem?: string;
  tipoIcone?: TeamVisualKind;
}) {
  if (input.imagem) {
    return input.imagem;
  }

  const idKey = slugify(input.id ?? "");
  const nameKey = slugify(normalizeTeamDisplayName(input.nome ?? ""));

  if (input.tipoIcone === "bandeira") {
    return SELECTION_FLAG_URLS[idKey] ?? SELECTION_FLAG_URLS[nameKey];
  }

  return CLUB_BADGE_URLS[idKey] ?? CLUB_BADGE_URLS[nameKey];
}

export function normalizeTeamDisplayName(name: string) {
  const trimmed = (name ?? "").trim();

  if (!trimmed) {
    return "";
  }

  return TEAM_DISPLAY_ALIASES[slugify(trimmed)] ?? trimmed;
}

export function resolveTeamVisualByName(name: string) {
  const key = slugify(normalizeTeamDisplayName(name));
  return CLUB_BADGE_URLS[key] ?? SELECTION_FLAG_URLS[key];
}
