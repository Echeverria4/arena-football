-- O caminho de leitura via tournament_has_active_share() ainda estava
-- bloqueando visualizadores em alguns cenarios (mismatch entre o
-- tournament_id armazenado em tournament_shares — que e text — e o uuid
-- da tabela tournaments, alem de casos onde o share foi criado com id
-- local antes do push relacional acontecer).
--
-- Como toda a base relacional ja e exposta publicamente via
-- tournament_shares.payload (link /s/{key} retorna snapshot completo) e
-- via os write-paths ainda exigirem creator/editor (can_edit_tournament),
-- a forma mais limpa de garantir que TODO refresh do visualizador puxe
-- dados frescos e abrir SELECT publico nessas 4 tabelas.
--
-- WRITES continuam protegidas — somente creator/editor podem
-- INSERT/UPDATE/DELETE via as policies existentes.

-- ---------- tournaments ---------------------------------------------------
drop policy if exists "tournaments_select_with_access" on public.tournaments;
drop policy if exists "tournaments_select_public" on public.tournaments;
create policy "tournaments_select_public"
on public.tournaments
for select
to authenticated, anon
using (true);

-- ---------- tournament_participants --------------------------------------
drop policy if exists "participants_select_with_access" on public.tournament_participants;
drop policy if exists "participants_select_public" on public.tournament_participants;
create policy "participants_select_public"
on public.tournament_participants
for select
to authenticated, anon
using (true);

-- ---------- matches -------------------------------------------------------
drop policy if exists "matches_select_with_access" on public.matches;
drop policy if exists "matches_select_public" on public.matches;
create policy "matches_select_public"
on public.matches
for select
to authenticated, anon
using (true);

-- ---------- standings -----------------------------------------------------
drop policy if exists "standings_select_with_access" on public.standings;
drop policy if exists "standings_select_public" on public.standings;
create policy "standings_select_public"
on public.standings
for select
to authenticated, anon
using (true);
