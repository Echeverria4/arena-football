-- Visualizadores que abrem um link compartilhado sem fazer login (role anon)
-- estavam recebendo apenas o snapshot inicial — o canal Realtime nao entregava
-- updates porque a policy SELECT em matches/tournaments/etc. so liberava para
-- creator + tournament_collaborators (que precisa de claim com login).
--
-- Esta migracao adiciona um caminho de leitura via "active share": qualquer
-- pessoa (anon ou authenticated) pode ler os dados relacionais de um
-- campeonato enquanto existir uma linha ativa em tournament_shares apontando
-- para ele. Como share_key tem 31^8 ≈ 8.5e11 combinacoes e o snapshot ja e
-- publico em tournament_shares.payload, ampliar SELECT para a mesma audiencia
-- e consistente com o modelo de compartilhamento e desbloqueia realtime para
-- visualizadores guest.

create or replace function public.tournament_has_active_share(target_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tournament_shares
    where tournament_id = target_tournament_id::text
      and (expires_at is null or expires_at > now())
  )
$$;

revoke all on function public.tournament_has_active_share(uuid) from public;
grant execute on function public.tournament_has_active_share(uuid) to authenticated, anon;

-- ---------- tournaments SELECT --------------------------------------------
drop policy if exists "tournaments_select_with_access" on public.tournaments;
create policy "tournaments_select_with_access"
on public.tournaments
for select
to authenticated, anon
using (
  (auth.uid() is not null and public.has_tournament_access(id))
  or public.tournament_has_active_share(id)
);

-- ---------- tournament_participants SELECT --------------------------------
drop policy if exists "participants_select_with_access" on public.tournament_participants;
create policy "participants_select_with_access"
on public.tournament_participants
for select
to authenticated, anon
using (
  (auth.uid() is not null and public.has_tournament_access(tournament_id))
  or public.tournament_has_active_share(tournament_id)
);

-- ---------- matches SELECT ------------------------------------------------
drop policy if exists "matches_select_with_access" on public.matches;
create policy "matches_select_with_access"
on public.matches
for select
to authenticated, anon
using (
  (auth.uid() is not null and public.has_tournament_access(tournament_id))
  or public.tournament_has_active_share(tournament_id)
);

-- ---------- standings SELECT ----------------------------------------------
drop policy if exists "standings_select_with_access" on public.standings;
create policy "standings_select_with_access"
on public.standings
for select
to authenticated, anon
using (
  (auth.uid() is not null and public.has_tournament_access(tournament_id))
  or public.tournament_has_active_share(tournament_id)
);
