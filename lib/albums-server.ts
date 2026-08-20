import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export type DbAlbum = {
  id: string
  title_en: string | null
  title_bn: string | null
  slug: string | null
  description_en: string | null
  description_bn: string | null
  cover_media_id: string | null
  published: boolean | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type DbAlbumPhoto = {
  id: string
  album_id: string
  media_id: string
  order: number | null
  created_at: string | null
}

export type AlbumListResult = {
  items: (DbAlbum & { photoCount: number; coverUrl: string | null })[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export const ALBUM_FIELDS =
  'id, title_en, title_bn, slug, description_en, description_bn, cover_media_id, published, created_by, created_at, updated_at'

export const ALBUM_PHOTO_FIELDS = 'id, album_id, media_id, order, created_at'

export async function listAlbums({
  page = 1,
  perPage = 24,
  search = '',
  status = ''
}: {
  page?: number
  perPage?: number
  search?: string
  status?: string
}): Promise<AlbumListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let query = admin.from('albums').select('id, title_en, title_bn, slug, description_en, description_bn, cover_media_id, published, created_by, created_at, updated_at, album_photos(id)', { count: 'exact' })
  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    query = query.or(`title_en.ilike.%${escaped}%,slug.ilike.%${escaped}%`)
  }
  if (status === 'published') query = query.eq('published', true)
  if (status === 'draft' || status === 'archived') query = query.eq('published', false)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const rows = (data ?? []) as (DbAlbum & { album_photos: { id: string }[] | null })[]

  const coverIds = [...new Set(rows.map((r) => r.cover_media_id).filter((id): id is string => Boolean(id)))]
  const coverUrlById = new Map<string, string | null>()
  if (coverIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await admin.from('media').select('id, public_url').in('id', coverIds)
    if (mediaError) {
      logError('albums.list-cover-media', mediaError)
    } else {
      for (const m of (mediaRows ?? []) as { id: string; public_url: string | null }[]) {
        coverUrlById.set(m.id, m.public_url)
      }
    }
  }

  const items = rows.map((row) => {
    return {
      id: row.id,
      title_en: row.title_en,
      title_bn: row.title_bn,
      slug: row.slug,
      description_en: row.description_en,
      description_bn: row.description_bn,
      cover_media_id: row.cover_media_id,
      published: row.published,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      photoCount: row.album_photos?.length ?? 0,
      coverUrl: row.cover_media_id ? (coverUrlById.get(row.cover_media_id) ?? null) : null
    }
  })

  const total = count ?? 0
  return {
    items,
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

export async function getMediaPublicUrl(mediaId: string): Promise<string | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('media').select('public_url').eq('id', mediaId).maybeSingle()
  if (error || !data) return null
  return (data as { public_url: string | null }).public_url
}

export async function getAlbum(id: string): Promise<DbAlbum | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('albums').select(ALBUM_FIELDS).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as DbAlbum | null) ?? null
}

export async function getAlbumBySlug(slug: string): Promise<DbAlbum | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('albums').select(ALBUM_FIELDS).eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data as DbAlbum | null) ?? null
}

export async function createAlbum(record: Partial<DbAlbum>): Promise<DbAlbum | null> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('albums') as any).insert(record).select(ALBUM_FIELDS).single()
  if (error) {
    logError('albums.create', error)
    throw error
  }
  return (data as DbAlbum) ?? null
}

export async function updateAlbum(id: string, fields: Partial<DbAlbum>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('albums') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function deleteAlbum(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { error } = await (admin.from('albums') as any).delete().eq('id', id)
  if (error) throw error
  return true
}

export async function listAlbumPhotos(albumId: string): Promise<DbAlbumPhoto[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('album_photos')
    .select(ALBUM_PHOTO_FIELDS)
    .eq('album_id', albumId)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as DbAlbumPhoto[]
}

export async function addPhotoToAlbum(albumId: string, mediaId: string, order?: number): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('album_photos') as any)
    .insert({ album_id: albumId, media_id: mediaId, order: order ?? 0 })
    .select('id')
  if (error) {
    logError('albums.add-photo', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function removePhotoFromAlbum(albumPhotoId: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('album_photos') as any).delete().eq('id', albumPhotoId).select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function reorderAlbumPhotos(albumId: string, orderedPhotoIds: string[]): Promise<void> {
  const admin = getAdminSupabase()
  for (let i = 0; i < orderedPhotoIds.length; i++) {
    const { error } = await (admin.from('album_photos') as any)
      .update({ order: i })
      .eq('album_id', albumId)
      .eq('id', orderedPhotoIds[i])
    if (error) throw error
  }
}

// Public gallery: published albums with their cover + photo public URLs.
// Optimized to 3 queries regardless of album/photo count (avoids N+1).
export async function getPublishedAlbums(): Promise<
  (DbAlbum & { photoCount: number; photos: { id: string; publicUrl: string }[] })[]
> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('albums')
    .select(ALBUM_FIELDS)
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) {
    logError('albums.public-list', error)
    return []
  }

  const albums = (data ?? []) as DbAlbum[]
  if (albums.length === 0) return []

  const albumIds = albums.map((a) => a.id)
  const { data: photoRows, error: photoError } = await admin
    .from('album_photos')
    .select(ALBUM_PHOTO_FIELDS)
    .in('album_id', albumIds)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true })
  if (photoError) {
    logError('albums.public-photos', photoError)
    return []
  }

  const mediaIds = [...new Set((photoRows ?? []).map((p) => p.media_id))]
  const mediaUrlById = new Map<string, string>()
  if (mediaIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await admin
      .from('media')
      .select('id, public_url')
      .in('id', mediaIds)
    if (mediaError) {
      logError('albums.public-media', mediaError)
    } else {
      for (const m of (mediaRows ?? []) as { id: string; public_url: string | null }[]) {
        if (m.public_url) mediaUrlById.set(m.id, m.public_url)
      }
    }
  }

  const photosByAlbum = new Map<string, { id: string; publicUrl: string }[]>()
  for (const photo of (photoRows ?? []) as DbAlbumPhoto[]) {
    const url = mediaUrlById.get(photo.media_id)
    if (!url) continue
    const list = photosByAlbum.get(photo.album_id) ?? []
    list.push({ id: photo.id, publicUrl: url })
    photosByAlbum.set(photo.album_id, list)
  }

  return albums.map((album) => ({
    ...album,
    photoCount: photosByAlbum.get(album.id)?.length ?? 0,
    photos: photosByAlbum.get(album.id) ?? []
  }))
}