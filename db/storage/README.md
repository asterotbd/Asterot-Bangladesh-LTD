Supabase Storage bucket setup commands (use Supabase CLI or Dashboard)

Buckets recommended for development:

- public-media (public)
- project-media (public)
- documents (private)
- academy-private (private)

Example using Supabase CLI:

```bash
supabase storage create-bucket public-media --public
supabase storage create-bucket project-media --public
supabase storage create-bucket documents --public=false
supabase storage create-bucket academy-private --public=false
```

Make sure to configure RLS and bucket policies in the Supabase dashboard for private buckets.

Buckets created on the linked project (`xkqdzsxsebxtcbbvkxjt`):

- `public-media` (public) — created to serve album/photo media. Create via SQL if needed:

```sql
insert into storage.buckets (id, name, public) values ('public-media', 'public-media', true)
on conflict (id) do nothing;
```
