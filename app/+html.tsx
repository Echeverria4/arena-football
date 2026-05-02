import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=0.80, maximum-scale=0.75, minimum-scale=0.75, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />

        {/* Open Graph — link preview (WhatsApp, Telegram, etc) */}
        <meta property="og:title" content="Arena Football ⚽" />
        <meta property="og:description" content="Gerencie campeonatos, acompanhe classificação, jogos e estatísticas." />
        <meta property="og:image" content="https://arena-football-app.vercel.app/og-image.png" />
        <meta property="og:url" content="https://arena-football-app.vercel.app" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Arena Football" />

        {/* Twitter / X card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arena Football ⚽" />
        <meta name="twitter:description" content="Gerencie campeonatos, acompanhe classificação, jogos e estatísticas." />
        <meta name="twitter:image" content="https://arena-football-app.vercel.app/og-image.png" />
        <ScrollViewStyleReset />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                background-color: #050A11 !important;
                overflow-x: hidden;
                max-width: 100vw;
                min-height: 100dvh;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
