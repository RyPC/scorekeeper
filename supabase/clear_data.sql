-- Wipe all ScoreKeeper app data (keeps schema, RLS, indexes).
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- This cannot be undone.

begin;

truncate table public.games restart identity;
truncate table public.friendships restart identity;
truncate table public.sports restart identity;
truncate table public.users restart identity;

commit;
