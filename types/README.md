Type generation

Use the Supabase CLI to generate TypeScript types for your database schema.

Example:

```bash
supabase gen types typescript --project-ref $SUPABASE_PROJECT_REF --schema public > types/supabase.ts
```

Set `SUPABASE_PROJECT_REF` in your `.env.local` or pass it directly.
