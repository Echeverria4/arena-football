alter table if exists public.tournament_shares
  add column if not exists tournament_id text;

update public.tournament_shares
set tournament_id = coalesce(tournament_id, payload->'campeonato'->>'id')
where tournament_id is null;

alter table if exists public.tournament_shares
  add column if not exists expires_at timestamptz;

update public.tournament_shares
set expires_at = coalesce(expires_at, now())
where coalesce(payload->'campeonato'->>'status', 'ativo') = 'finalizado';

create index if not exists idx_tournament_shares_tournament_id
  on public.tournament_shares (tournament_id);

create index if not exists idx_tournament_shares_expires_at
  on public.tournament_shares (expires_at);
