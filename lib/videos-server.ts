import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export type DbVideo = {
  id: string
  public_url: string | null
  caption_en: string | null
  caption_bn: string | null
  category: string | null
  published: boolean | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}

export type VideoListResult = {
  items: DbVideo[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export const VIDEO_FIELDS =
  'id, public_url, caption_en, caption_bn, category, published, metadata, created_at'

export async function listVideos({
  page = 1,
  perPage = 24,
  search = '',
  status = ''
}: {
  page?: number
  perPage?: number
  search?: string
  status?: string
}): Promise<VideoListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let query = admin
    .from('media')
    .select(VIDEO_FIELDS, { count: 'exact' })
    .eq('type', 'video')
    .eq('provider', 'youtube')

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    query = query.or(`caption_en.ilike.%${escaped}%,category.ilike.%${escaped}%`)
  }
  if (status === 'published') query = query.eq('published', true)
  if (status === 'draft' || status === 'archived') query = query.eq('published', false)

  const { data, count, error } = await query
    .order('metadata->>publishedAt', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const total = count ?? 0
  return {
    items: (data ?? []) as DbVideo[],
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

export async function getVideo(id: string): Promise<DbVideo | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('media').select(VIDEO_FIELDS).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as DbVideo | null) ?? null
}

export async function updateVideo(id: string, fields: Partial<DbVideo>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('media') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) {
    logError('videos.update', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function deleteVideo(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { error } = await (admin.from('media') as any).delete().eq('id', id)
  if (error) {
    logError('videos.delete', error)
    throw error
  }
  return true
}

// Public-facing synced videos: published youtube videos only.
export async function getPublishedVideos(): Promise<DbVideo[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('media')
    .select(VIDEO_FIELDS)
    .eq('type', 'video')
    .eq('provider', 'youtube')
    .eq('published', true)
    .order('metadata->>publishedAt', { ascending: false })
  if (error) {
    logError('videos.public-list', error)
    return []
  }
  return (data ?? []) as DbVideo[]
}