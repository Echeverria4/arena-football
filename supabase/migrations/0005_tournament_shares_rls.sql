-- Enable RLS on tournament_shares and allow public (anon) access.
-- Share keys are unguessable (8-char random), so open read/write is safe.

alter table public.tournament_shares enable row level security;

-- Anyone (including unauthenticated users) can read a share by its key.
drop policy if exists "shares_select_public" on public.tournament_shares;
create policy "shares_select_public"
on public.tournament_shares
for select
to anon, authenticated
using (true);

-- Anyone can create a share link (devices that are not logged in still need to share).
drop policy if exists "shares_insert_public" on public.tournament_shares;
create policy "shares_insert_public"
on public.tournament_shares
for insert
to anon, authenticated
with check (true);

-- Anyone can update expiration (needed to expire shares on tournament end).
drop policy if exists "shares_update_expiration" on public.tournament_shares;
create policy "shares_update_expiration"
on public.tournament_shares
for update
to anon, authenticated
using (true)
with check (true);
