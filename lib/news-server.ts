import getAdminSupabase from './supabaseAdmin'
import type { NewsArticle } from './newsData'

export type DbNews = {
  id: string
  title_en: string
  title_bn: string | null
  slug: string
  subtitle_en: string | null
  subtitle_bn: string | null
  excerpt_en: string | null
  excerpt_bn: string | null
  content_en: string | null
  content_bn: string | null
  category_id: string | null
  author_id: string | null
  status: string | null
  published: boolean
  published_at: string | null
  created_at: string | null
  updated_at: string | null
  featured_image: string | null
}

export type NewsCategory = {
  id: string
  name_en: string | null
  slug: string | null
}

const NEWS_FIELDS =
  'id, title_en, title_bn, slug, subtitle_en, subtitle_bn, excerpt_en, excerpt_bn, content_en, content_bn, category_id, author_id, status, published, published_at, created_at, updated_at, featured_image'

const DEFAULT_NEWS_IMAGE = '/media/photos/corporate-events/AUM09214.jpg'

const NEWS_CATEGORY_LABELS = ['Latest News', 'Announcements', 'Articles / Updates'] as const

type RawNewsRow = DbNews & {
  category: { name_en: string | null } | { name_en: string | null }[] | null
  featured_media: { public_url: string | null } | { public_url: string | null }[] | null
}

function formatNewsDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function toParagraphs(content: string | null, fallback: string | null): string[] {
  const source = content ?? fallback
  if (!source) return ['More details will be shared soon.']
  const paragraphs = source.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  return paragraphs.length > 0 ? paragraphs : [source.trim()]
}

function mapToNewsArticle(item: RawNewsRow, featured: boolean): NewsArticle {
  const cat = Array.isArray(item.category) ? item.category[0] : item.category
  const label = cat?.name_en as NewsArticle['category'] | undefined
  const category: NewsArticle['category'] = NEWS_CATEGORY_LABELS.includes(label as never)
    ? (label as NewsArticle['category'])
    : 'Latest News'
  const media = Array.isArray(item.featured_media) ? item.featured_media[0] : item.featured_media
  const image = media?.public_url || DEFAULT_NEWS_IMAGE
  return {
    slug: item.slug,
    title: item.title_en || item.title_bn || item.slug,
    category,
    excerpt: item.excerpt_en || item.excerpt_bn || '',
    content: toParagraphs(item.content_en, item.excerpt_en),
    date: formatNewsDate(item.published_at || item.created_at),
    image,
    featured
  }
}

export async function getPublishedNewsArticles(): Promise<NewsArticle[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('news')
    .select(`${NEWS_FIELDS}, category:categories(name_en), featured_media:media(public_url)`)
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('created_at', { ascending: false, nullsFirst: true })
    .limit(50)
  if (error) {
    console.error('getPublishedNewsArticles error', error.message)
    return []
  }
  const rows = (data ?? []) as RawNewsRow[]
  return rows.map((item, index) => mapToNewsArticle(item, index < 3))
}

export async function getPublishedNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('news')
    .select(`${NEWS_FIELDS}, category:categories(name_en), featured_media:media(public_url)`)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) {
    console.error('getPublishedNewsArticleBySlug error', error.message)
    return null
  }
  if (!data) return null
  return mapToNewsArticle(data as RawNewsRow, true)
}

// Resolves a slug regardless of publishing state. Used by the public detail
// page so a slug owned by the database (even as a draft) never resolves to the
// static fallback article.
export async function getNewsBySlug(slug: string): Promise<DbNews | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('news')
    .select(NEWS_FIELDS)
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('getNewsBySlug error', error.message)
    return null
  }
  return (data as DbNews | null) ?? null
}

export async function getAllNews(): Promise<DbNews[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('news')
    .select(NEWS_FIELDS)
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('created_at', { ascending: false, nullsFirst: true })
  if (error) {
    console.error('getAllNews error', error.message)
    throw error
  }
  return (data ?? []) as DbNews[]
}

export async function getNewsById(id: string): Promise<DbNews | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('news')
    .select(NEWS_FIELDS)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('getNewsById error', error.message)
    return null
  }
  return (data as DbNews | null) ?? null
}

export async function deleteNews(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { error } = await (admin.from('news') as any).delete().eq('id', id)
  if (error) {
    console.error('deleteNews error', error.message)
    return false
  }
  return true
}

export async function getNewsCategories(): Promise<NewsCategory[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('categories')
    .select('id, name_en, slug')
    .order('name_en', { ascending: true })
  if (error) {
    console.error('getNewsCategories error', error.message)
    return []
  }
  return (data ?? []) as NewsCategory[]
}
