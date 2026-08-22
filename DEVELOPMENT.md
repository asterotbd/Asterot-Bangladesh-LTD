# DEVELOPMENT.md — Starting from a fresh environment

Asterot Bangladesh Ltd website — Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase, deployed on Vercel.

Requirements: **Node.js >= 18.17 (Node 20 LTS recommended)** and **npm** (the project uses `package-lock.json`; do not switch package managers).

---

## Option A — GitHub Codespaces / browser VS Code (recommended after OS reinstall)

1. Open <https://github.com/asterotbd/Asterot-Bangladesh-LTD>
2. Click **Code → Codespaces → Create codespace on main**
   (or open the repo in VS Code for the Web via **Code → Codespaces**; vscode.dev alone can edit files but cannot run the dev server)
3. The devcontainer installs Node 20 and runs `npm install` automatically.
4. Create your local env file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in at least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (values come from the Supabase Dashboard → Settings → API). Real secrets stay out of Git.
5. Start the dev server:
   ```bash
   npm run dev
   ```
6. Open the forwarded port 3000 URL that Codespaces offers (or the Ports panel).

## Option B — Local machine (Windows / macOS / Linux)

```bash
git clone https://github.com/asterotbd/Asterot-Bangladesh-LTD
cd Asterot-Bangladesh-LTD

# use Node 20 (e.g. nvm install / nvm use reads .nvmrc)
nvm install
nvm use

npm install
cp .env.example .env.local   # then fill in real values
npm run dev                  # http://localhost:3000
```

## Common commands

| Command             | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Dev server on port 3000              |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | ESLint (`next/core-web-vitals`)      |
| `npm run type-check`| TypeScript check (`tsc --noEmit`)    |

## Environment variables

See [`.env.example`](.env.example) for every variable with explanations. Summary:

| Variable                             | Required | Scope        | Purpose                                   |
| ------------------------------------ | -------- | ------------ | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | yes      | client+server| Supabase project URL                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| yes     | client+server| Public anon key (protected by RLS)        |
| `SUPABASE_SERVICE_ROLE_KEY`          | yes*     | server-only  | Bypasses RLS for admin APIs & cron        |
| `YOUTUBE_API_KEY`                    | no       | server-only  | YouTube Data API for video sync           |
| `YOUTUBE_CHANNEL_ID`                 | no       | server-only  | Defaults to the Asterot channel           |
| `CRON_SECRET`                        | prod     | server-only  | Protects `/api/cron/youtube-sync`         |
| `SUPABASE_PROJECT_REF`               | no       | CLI only     | Type generation with Supabase CLI         |

\* Required for admin panel/API routes to work locally.

Never commit `.env.local`. The `.gitignore` blocks all `.env*` except `.env.example`.

## Database / Supabase migrations

Migrations live in [`supabase/migrations`](supabase/migrations) (identical copies in `db/migrations`). They are already applied to the production Supabase project — only apply new ones when developing schema changes:

1. Install the CLI: `npm install -g supabase && supabase login`
2. Link once: `supabase link --project-ref $SUPABASE_PROJECT_REF`
3. Apply a migration via the Supabase SQL editor or `supabase db push`.

## Deployment (Vercel)

- Connected GitHub repo `asterotbd/Asterot-Bangladesh-LTD`, Vercel project `asterot-bangladesh-ltd`.
- Every push to `main` deploys to production (<https://www.asterot.com>).
- Env vars are configured in **Vercel → Project → Settings → Environment Variables** (no `.env` file is deployed).
- A daily cron (`vercel.json`: 03:00 UTC) plus a GitHub Action every 15 min trigger `/api/cron/youtube-sync` using the `CRON_SECRET` secret configured in both Vercel and GitHub Actions.

## Notes

- All site media lives in `public/` and is committed — no external drives or local paths needed.
- No Windows-specific tooling or paths exist in the repository; it develops identically on any OS.
