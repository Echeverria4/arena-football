-- Add tournament-specific display overrides to tournament_participants.
-- display_name: player name shown in this tournament (overrides users.name when set)
-- phone: WhatsApp number for this tournament slot (overrides users.whatsapp_number when set)
-- Both are nullable — NULL means fall back to the linked user's global profile.

alter table public.tournament_participants
  add column if not exists display_name text,
  add column if not exists phone text;
