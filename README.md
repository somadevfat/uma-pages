# uma-pages

## Quickstart

Prerequisites:
- Node.js (LTS recommended)

Steps:
1. Install dependencies
   - `cd backend && npm ci`
2. Configure environment variables
   - `cp backend/.env.example backend/.env`
   - Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Start the dev server
   - `cd backend && npm run dev`

## Supabase setup (recommended to run via commands later)

This repository intentionally does not include real Supabase credentials.
Use one of the following approaches.

- Use an existing hosted Supabase project
  - Put the project URL and anon (publishable) key into `backend/.env`.

- (Optional) Use Supabase CLI for local development
  - Install the CLI (one option): `npm i -g supabase`
  - From `backend/`, run: `supabase start`
  - Copy the printed local URL/key into `backend/.env`

Notes:
- Do NOT use the service role key in `.env`.
- `.env` is git-ignored; commit changes should go to `.env.example` only.
