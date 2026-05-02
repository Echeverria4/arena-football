const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "../dist/index.html");

if (!fs.existsSync(indexPath)) {
  console.error("dist/index.html not found — run `npm run build` first.");
  process.exit(1);
}

const ogTags = [
  '<meta property="og:title" content="Arena Football ⚽" />',
  '<meta property="og:description" content="Gerencie campeonatos, acompanhe classificação, jogos e estatísticas." />',
  '<meta property="og:image" content="https://arena-football-app.vercel.app/og-image.png" />',
  '<meta property="og:image:width" content="512" />',
  '<meta property="og:image:height" content="512" />',
  '<meta property="og:url" content="https://arena-football-app.vercel.app" />',
  '<meta property="og:type" content="website" />',
  '<meta property="og:site_name" content="Arena Football" />',
  '<meta name="twitter:card" content="summary_large_image" />',
  '<meta name="twitter:title" content="Arena Football ⚽" />',
  '<meta name="twitter:description" content="Gerencie campeonatos, acompanhe classificação, jogos e estatísticas." />',
  '<meta name="twitter:image" content="https://arena-football-app.vercel.app/og-image.png" />',
].join("\n  ");

let html = fs.readFileSync(indexPath, "utf-8");

if (html.includes('property="og:title"')) {
  console.log("OG tags already present — skipping.");
  process.exit(0);
}

html = html.replace("</head>", `  ${ogTags}\n</head>`);
fs.writeFileSync(indexPath, html, "utf-8");
console.log("✓ OG meta tags injected into dist/index.html");
