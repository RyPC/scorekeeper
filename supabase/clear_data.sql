-- ScoreKeeper: wipe all app data (keeps tables, RLS, indexes).
--
-- Run in Supabase Dashboard → SQL Editor → paste the ACTIVE block below → Run.
-- Must be the same project as NEXT_PUBLIC_SUPABASE_URL in your app.
--
-- If counts stay non-zero after running:
--   • Run the ENTIRE block (not one line at a time).
--   • Refresh Table Editor (or re-open the table).
--   • Confirm you’re not on a read-only branch / wrong project.

-- ---------------------------------------------------------------------------
-- Preferred: one TRUNCATE so Postgres handles FK order + dependent rows
-- ---------------------------------------------------------------------------
truncate table
  public.games,
  public.friendships,
  public.sports,
  public.users
restart identity cascade;

-- ---------------------------------------------------------------------------
-- Verify (uncomment and run — every count should be 0)
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.games) as games,
--   (select count(*) from public.friendships) as friendships,
--   (select count(*) from public.sports) as sports,
--   (select count(*) from public.users) as users;

-- ---------------------------------------------------------------------------
-- Fallback: if TRUNCATE errors (permissions / lock), try DELETE in order.
-- Still use SQL Editor as a role that can bypass RLS (default postgres does).
-- ---------------------------------------------------------------------------
-- delete from public.games;
-- delete from public.friendships;
-- delete from public.sports;
-- delete from public.users;
