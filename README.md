# Arena Football

Base inicial do app mobile para campeonatos de eFootball 2026, montada em `React Native + Expo Router + Supabase + NativeWind + Zustand`.

## Estrutura criada

- `app/`: rotas do Expo Router, incluindo `boot`, `loading`, `login`, tabs e telas iniciais de campeonato.
- `src/components/`: componentes reutilizaveis de UI, boot, partidas, classificacao, videos e trofeus.
- `src/services/`: camada de integracao com Supabase e servicos do dominio.
- `src/stores/`: estado global leve com Zustand.
- `src/lib/`: constantes, formatadores, validacoes e geracao de link do WhatsApp.
- `src/types/`: tipos de auth, campeonato, partida, video e trofeu.
- `supabase/`: migration inicial, policies de RLS e seed do MVP.
- `assets/`: pastas reservadas para imagens, icones e escudos.

## Rotas principais

- `/boot`
- `/loading`
- `/(auth)/login`
- `/(tabs)/home`
- `/tournament/create`
- `/tournament/[id]`
- `/tournament/matches`
- `/tournament/standings`
- `/tournament/participants`
- `/tournament/videos`
- `/match/[id]`

## Observacoes

- O ambiente atual nao tem `node` nem `npm`, entao o projeto foi scaffoldado manualmente e nao teve dependencias instaladas.
- Os servicos ainda usam dados mockados em `src/lib/constants.ts` para deixar a navegacao e a estrutura prontas.
- Para ligar o app no Supabase real, preencha `.env` a partir de `.env.example` e substitua os mocks pelos servicos definitivos.

## Proximos passos

1. Instalar Node.js.
2. Rodar `npm install` dentro da pasta `Arena`.
3. Configurar o projeto Supabase e aplicar os arquivos de `supabase/`.
4. Conectar autenticacao, storage, upload de videos e calculo real de classificacao.
