# Asterot — Next.js + TypeScript + Tailwind scaffold

This repository contains the initial scaffold for the Asterot Bangladesh Limited website.

Local setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env.local
# Fill in Supabase keys and other env vars when available
```

3. Run the development server

```bash
npm run dev
```

Development notes

- App Router: pages are under `/app`.
- Global styles: `styles/globals.css` (Tailwind configured).
- Design tokens: CSS variables in `globals.css` and Tailwind theme.
- Admin routes are scaffolded under `/app/admin` — authentication and RBAC to be implemented next.

Database & Supabase

This project uses Supabase (Postgres) as the intended backend. The `db/migrations` folder contains SQL migration files you can apply to a Supabase project.

Basic steps:

1. Install and login to the Supabase CLI: `npm install -g supabase` and `supabase login`.
2. Create a Supabase project via the dashboard and note your `project ref`.
3. Configure `.env.local` from `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (service role key must remain server-only).
4. Run migrations using the Supabase SQL editor or `supabase` CLI by applying the files in `db/migrations` in order.

Type generation

See `types/README.md` for instructions to generate TypeScript types from your Supabase DB.

Storage

See `db/storage/README.md` for recommended storage buckets and CLI commands to create them.
