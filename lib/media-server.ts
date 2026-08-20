import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export const MEDIA_TYPES = ['photo', 'video', 'embed'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

export type DbMedia = {
  id: string
  storage_path: string | null
  public_url: string | null
  type: string | null
  provider: string | null
  alt_en: string | null
  alt_bn: string | null
  caption_en: string | null
  caption_bn: string | null
  width: number | null
  height: number | null
  filesize: number | null
  category: string | null
  created_by: string | null
  created_at: string | null
}

export type MediaListResult = {
  items: DbMedia[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export const PUBLIC_MEDIA_BUCKET = 'public-media'

// Raster image formats the media library accepts. SVG/HTML are intentionally
// excluded: SVG can embed script and browsers execute it when the file is
// served with image/svg+xml, and HTML is not an image.
const IMAGE_TYPES: Record<string, string> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
  avif: 'avif',
  bmp: 'bmp'
}

const IMAGE_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp'
}

export type ImageValidation =
  | { ok: true; type: string; ext: string; contentType: string }
  | { ok: false; error: string }

// Validate an uploaded image by inspecting its magic bytes (not the spoofable
// client-declared Content-Type) and requiring the file extension to match.
export function validateUploadedImage(file: File, buffer: Buffer): ImageValidation {
  const rawExt = (file.name.split('.').pop() || '').toLowerCase()
  const ext = rawExt.replace(/[^a-z0-9]/g, '')
  const declaredType = IMAGE_TYPES[ext]
  if (!declaredType) {
    return { ok: false, error: 'Unsupported file type. Use JPG, PNG, GIF, WebP, AVIF, or BMP.' }
  }

  const sniffedType = sniffImageType(buffer)
  if (!sniffedType) {
    return { ok: false, error: 'The file is not a valid image.' }
  }
  if (sniffedType !== declaredType) {
    return { ok: false, error: 'The file content does not match its extension.' }
  }
  return { ok: true, type: sniffedType, ext, contentType: IMAGE_MIME[sniffedType] }
}

function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  const bytes = buffer.subarray(0, 12)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png'
  const ascii = bytes.toString('latin1')
  if (ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')) return 'gif'
  if (ascii.slice(0, 4) === 'RIFF' && ascii.slice(8, 12) === 'WEBP') return 'webp'
  if (ascii.slice(4, 8) === 'ftyp' && ['avif', 'avis', 'av01'].includes(ascii.slice(8, 12))) return 'avif'
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'bmp'
  return null
}

export async function listMedia({
  page = 1,
  perPage = 24,
  search = '',
  type = ''
}: {
  page?: number
  perPage?: number
  search?: string
  type?: string
}): Promise<MediaListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let query = admin.from('media').select('id, storage_path, public_url, type, provider, alt_en, alt_bn, caption_en, caption_bn, width, height, filesize, category, created_by, created_at', { count: 'exact' })

  // The Media Library must only contain media assets intended for the library.
  // A media row that is a news article's featured image belongs to Admin → News
  // (news.featured_image → media.id) and is therefore excluded here at the query
  // layer. Existing news records and their images are never modified.
  const { data: newsFeaturedRows, error: newsFeaturedError } = await admin
    .from('news')
    .select('featured_image')
    .not('featured_image', 'is', null)
  if (newsFeaturedError) {
    logError('media.news-featured', newsFeaturedError)
  } else {
    const newsMediaIds = [...new Set((newsFeaturedRows ?? []).map((r) => (r as { featured_image: string | null }).featured_image).filter((id): id is string => Boolean(id)))]
    if (newsMediaIds.length > 0) {
      query = query.not('id', 'in', `(${newsMediaIds.join(',')})`)
    }
  }

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    query = query.or(`alt_en.ilike.%${escaped}%,caption_en.ilike.%${escaped}%,category.ilike.%${escaped}%`)
  }
  if (type && (MEDIA_TYPES as readonly string[]).includes(type as MediaType)) {
    query = query.eq('type', type)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const total = count ?? 0
  return {
    items: (data ?? []) as DbMedia[],
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

export async function getMedia(id: string): Promise<DbMedia | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('media')
    .select('id, storage_path, public_url, type, provider, alt_en, alt_bn, caption_en, caption_bn, width, height, filesize, category, created_by, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as DbMedia | null) ?? null
}

export async function createMedia(record: Partial<DbMedia>): Promise<DbMedia | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('media').insert(record as any).select().single()
  if (error) {
    logError('media.create', error)
    throw error
  }
  return (data as DbMedia) ?? null
}

export async function updateMedia(id: string, fields: Partial<DbMedia>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('media') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function deleteMedia(id: string): Promise<{ ok: boolean; storagePath: string | null }> {
  const admin = getAdminSupabase()
  const item = await getMedia(id)
  if (!item) return { ok: false, storagePath: null }

  let storagePath: string | null = null
  if (item.storage_path && item.provider === 'uploaded') {
    storagePath = item.storage_path
  }

  const { error } = await (admin.from('media') as any).delete().eq('id', id)
  if (error) throw error
  return { ok: true, storagePath }
}

export async function deleteStorageFile(storagePath: string): Promise<void> {
  try {
    const admin = getAdminSupabase()
    await admin.storage.from(PUBLIC_MEDIA_BUCKET).remove([storagePath])
  } catch (err) {
    logError('media.storage-delete', err)
  }
}

export async function uploadMediaFile(file: File, buffer: Buffer, contentType: string): Promise<{ storagePath: string; publicUrl: string }> {
  const admin = getAdminSupabase()
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const storagePath = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await admin.storage.from(PUBLIC_MEDIA_BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: '3600'
  })
  if (error) {
    logError('media.storage-upload', error)
    throw new Error(error.message)
  }

  const { data } = admin.storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(storagePath)
  return { storagePath, publicUrl: data.publicUrl }
}
