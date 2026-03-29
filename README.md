# ScoreKeeper

Mobile-first web app to track game scores, per-sport stats, and head-to-head history with friends. Built with **Next.js** (App Router), **Tailwind CSS**, and **Supabase** (PostgreSQL).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env.local` and fill in values from the Supabase dashboard (**Project Settings → API**):

   - `NEXT_PUBLIC_SUPABASE_URL` — project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `anon` public key (used for anon reads where applicable)  
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (**server-only**; never commit or expose to the client)  
   - `SESSION_SECRET` — long random string used to sign the session cookie (e.g. `openssl rand -hex 32`)

3. **Database**

   Apply the SQL migration in Supabase:

   - **SQL Editor**: paste and run the contents of [`supabase/migrations/20260329000000_initial_schema.sql`](supabase/migrations/20260329000000_initial_schema.sql),  
   - or use the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase db push` / `supabase migration up` after linking the project.

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push the repo to GitHub (or GitLab / Bitbucket) and import the project in [Vercel](https://vercel.com).  
2. Add the same environment variables in **Project → Settings → Environment Variables**.  
3. Deploy. Production builds require all variables above; `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` must be set for server actions and middleware.

## Security note

Sign-in is **passwordless**: users pick a profile from a list. The app sets a signed HTTP-only cookie so only your server actions (using the service role) can write to the database. This is appropriate for casual tracking among friends but is **not** strong identity proof—treat it as a shared-device / honor-system model.

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run start` — run production server  
- `npm run lint` — ESLint  
