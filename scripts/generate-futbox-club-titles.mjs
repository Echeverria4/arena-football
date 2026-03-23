import fs from "node:fs";
import path from "node:path";

const FUTBOX_URL = "https://www.futbox.com/pt/campeonatos";
const OUTPUT_PATH = path.resolve("src/lib/futbox-generated.ts");

const confederationMeta = {
  afc: { label: "AFC", subtitle: "Ásia" },
  caf: { label: "CAF", subtitle: "África" },
  concacaf: {
    label: "CONCACAF",
    subtitle: "América do Norte, Central e Caribe",
  },
  conmebol: { label: "CONMEBOL", subtitle: "América do Sul" },
  ofc: { label: "OFC", subtitle: "Oceania" },
  uefa: { label: "UEFA", subtitle: "Europa" },
};

const confederationOrder = ["afc", "caf", "concacaf", "conmebol", "ofc", "uefa"];

function decodeHtml(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (match, entity) => namedEntities[entity] ?? match);
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function buildItem(id, title, imageUrl, season) {
  return {
    id,
    title,
    season,
    imageUrl,
  };
}

function buildNode(id, label, subtitle, items = [], children = undefined) {
  const node = { id, label, subtitle };

  if (children && children.length > 0) {
    node.children = children;
  } else {
    node.items = items;
  }

  return node;
}

function collectMenuLabels(html) {
  const labelById = new Map();
  const countryOrderByConfederation = new Map();
  const liRegex = /<li id="li-([^"]+)"[\s\S]*?<a [^>]*>([\s\S]*?)<\/a>\s*<\/li>/g;

  for (const match of html.matchAll(liRegex)) {
    const [, id, rawLabel] = match;
    const label = stripTags(rawLabel);

    labelById.set(id, label);

    if (!id.startsWith("clubes_nacionais_")) {
      continue;
    }

    const parts = id.split("_");

    if (parts.length !== 4) {
      continue;
    }

    const confederationId = parts[2];
    const countryId = parts[3];
    const currentOrder = countryOrderByConfederation.get(confederationId) ?? [];

    if (!currentOrder.includes(countryId)) {
      currentOrder.push(countryId);
      countryOrderByConfederation.set(confederationId, currentOrder);
    }
  }

  return { labelById, countryOrderByConfederation };
}

function collectClubTitles(html) {
  const continentalItems = new Map();
  const nationalItems = new Map();
  const cardRegex =
    /<div class="trof[\s\S]*?style="background-image:url\(([^)]+)\);?"[\s\S]*?data-hashpath="([^"]+)"[\s\S]*?<a href="[^"]*">([\s\S]*?)<\/a>\s*<\/p>\s*<\/div>/g;

  for (const match of html.matchAll(cardRegex)) {
    const [, imageUrl, hashPath, rawTitle] = match;
    const title = stripTags(rawTitle);
    const parts = hashPath.split("_");

    if (parts[0] !== "clubes") {
      continue;
    }

    if (parts[1] === "continentais" && parts.length >= 4) {
      const confederationId = parts[2];
      const confederation = confederationMeta[confederationId];

      if (!confederation) {
        continue;
      }

      const items = continentalItems.get(confederationId) ?? [];

      items.push(
        buildItem(
          hashPath,
          title,
          imageUrl,
          `Clubes • Continentais • ${confederation.label}`,
        ),
      );

      continentalItems.set(confederationId, items);
    }

    if (parts[1] === "nacionais" && parts.length >= 5) {
      const confederationId = parts[2];
      const countryId = parts[3];
      const bucketKey = `${confederationId}:${countryId}`;
      const items = nationalItems.get(bucketKey) ?? [];

      items.push(
        buildItem(
          hashPath,
          title,
          imageUrl,
          `Clubes • Nacionais • ${countryId}`,
        ),
      );

      nationalItems.set(bucketKey, items);
    }
  }

  return { continentalItems, nationalItems };
}

function createGeneratedFile(continentalNodes, nationalNodes) {
  return `export const generatedClubContinentalNodes = ${JSON.stringify(
    continentalNodes,
    null,
    2,
  )};\n\nexport const generatedClubNationalNodes = ${JSON.stringify(
    nationalNodes,
    null,
    2,
  )};\n`;
}

const response = await fetch(FUTBOX_URL);

if (!response.ok) {
  throw new Error(`Falha ao carregar ${FUTBOX_URL}: ${response.status}`);
}

const html = await response.text();
const { labelById, countryOrderByConfederation } = collectMenuLabels(html);
const { continentalItems, nationalItems } = collectClubTitles(html);

const continentalNodes = confederationOrder
  .filter((confederationId) => continentalItems.has(confederationId))
  .map((confederationId) => {
    const meta = confederationMeta[confederationId];

    return buildNode(
      confederationId,
      meta.label,
      meta.subtitle,
      continentalItems.get(confederationId),
    );
  });

const nationalNodes = confederationOrder
  .filter((confederationId) => countryOrderByConfederation.has(confederationId))
  .map((confederationId) => {
    const meta = confederationMeta[confederationId];
    const countryNodes = (countryOrderByConfederation.get(confederationId) ?? [])
      .filter((countryId) => nationalItems.has(`${confederationId}:${countryId}`))
      .map((countryId) => {
        const countryLabel =
          labelById.get(`clubes_nacionais_${confederationId}_${countryId}`) ?? countryId;
        const items = (nationalItems.get(`${confederationId}:${countryId}`) ?? []).map((item) => ({
          ...item,
          season: `Clubes • Nacionais • ${countryLabel}`,
        }));

        return buildNode(countryId, countryLabel, `Clubes nacionais de ${countryLabel}`, items);
      });

    return buildNode(confederationId, meta.label, meta.subtitle, [], countryNodes);
  });

fs.writeFileSync(
  OUTPUT_PATH,
  createGeneratedFile(continentalNodes, nationalNodes),
  "utf8",
);

console.log(`Arquivo gerado em ${OUTPUT_PATH}`);
