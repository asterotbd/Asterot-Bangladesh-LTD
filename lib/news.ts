import createServerClient from './supabaseServer'

export type NewsItem = {
  id: string
  title_en: string
  slug: string
  excerpt_en: string | null
  published_at: string | null
  category: { name_en: string | null } | null
  featured_image: { public_url: string | null, alt_en: string | null } | null
}

type RawNewsItem = {
  id: string
  title_en: string
  slug: string
  excerpt_en: string | null
  published_at: string | null
  category: { name_en: string | null }[] | null
  featured_image: { public_url: string | null, alt_en: string | null }[] | null
}

export async function getPublishedNewsItems(): Promise<NewsItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('news')
    .select(`id, title_en, slug, excerpt_en, published_at, category:categories(name_en), featured_image:media(public_url, alt_en)`)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(12)

  if (error) {
    console.error('getPublishedNewsItems error', error.message)
    return []
  }

  const rawItems = (data ?? []) as RawNewsItem[]
  return rawItems.map(item => ({
    ...item,
    category: item.category?.[0] ?? null,
    featured_image: item.featured_image?.[0] ?? null,
  }))
}
