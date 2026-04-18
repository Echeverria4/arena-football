import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=0.85, maximum-scale=0.85, minimum-scale=0.85, user-scalable=no"
        />
        <ScrollViewStyleReset />
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
