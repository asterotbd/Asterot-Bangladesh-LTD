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
