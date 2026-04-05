create table if not exists public.tournament_shares (
  id uuid primary key default gen_random_uuid(),
  share_key text not null unique,
  access text not null check (access in ('editor', 'viewer')),
  tournament_name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tournament_shares_share_key
  on public.tournament_shares (share_key);

create index if not exists idx_tournament_shares_created_at
  on public.tournament_shares (created_at desc);