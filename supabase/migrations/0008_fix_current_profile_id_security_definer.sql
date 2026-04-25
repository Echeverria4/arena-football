-- Fix: tournaments INSERT was still failing with 42501 even after the INSERT
-- policy was added in 0007. The values were correct (creator_id matches the
-- user's profile), so the only explanation is that current_profile_id() was
-- returning NULL inside the policy — typically because the function's
-- SELECT on public.users is evaluated in a context where it can't see the
-- caller's row.
--
-- Switch the helper to SECURITY DEFINER so its lookup runs as the function
-- owner (bypassing RLS on public.users), guaranteeing a deterministic
-- profile-id lookup regardless of how RLS is configured.

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1
$$;

revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated, anon;
