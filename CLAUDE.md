@AGENTS.md

# ScoreKeeper

Mobile-first web app for tracking competitive game scores among friends.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (PostgreSQL), custom JWT auth (`jose`), Recharts 3.8, date-fns 4.1, TypeScript 5.

## Architecture

- **Server components** (`page.tsx`) fetch data; **client components** (`*-client.tsx`) handle interactivity
- **Server actions** in `src/app/actions/` return `{ ok: true }` or `{ error: string }`
- **Query helpers** in `src/lib/queries.ts` use the Supabase service role client (anon reads, service role writes)
- `revalidatePath()` for cache invalidation after mutations

## Auth

Passwordless — users pick a username from a list. Session stored as HS256 JWT cookie (`sk_session`, 30-day expiry). `src/middleware.ts` protects `/dashboard`, `/games`, `/stats`, `/friends`.

Key files: `src/lib/session.ts`, `src/lib/auth-server.ts`, `src/app/actions/auth.ts`

## Key Features

- **Sports**: Custom sports created per user (`src/app/actions/sports.ts`)
- **Games**: Log matches between two players with scores + optional notes (`src/app/actions/games.ts` → `addGame()`)
- **Dashboard**: Sport selector, W/L/T record, recent games, H2H buttons (`src/app/(app)/dashboard/`)
- **Friends**: Add/remove friends from global user list; triggers H2H modal (`src/app/(app)/friends/`)
- **Head-to-Head Modal**: Interactive Recharts line chart with cumulative win/loss trend, peak/trough markers, per-game tooltips (`src/components/FriendH2HModal.tsx`)
- **Stats**: Win/loss overview per sport (`src/app/(app)/stats/`)

## Database (Supabase)

Tables: `users`, `sports`, `games`, `friendships`

- Friendships are bidirectional — stored as two rows; queries use `or()` to match both directions
- RLS: public `SELECT`, service role for writes
- Schema: `supabase/migrations/20260329000000_initial_schema.sql`

## Utilities

- `src/lib/game-stats.ts` → `scoresForUser()`: normalizes game perspective (which player is "you") — use this everywhere scores are displayed
- `src/components/AppShell.tsx`: bottom nav bar, mobile FAB for new games
- `src/components/UserAvatar.tsx`: avatar with initials fallback
