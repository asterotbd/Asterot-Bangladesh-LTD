import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'
import { revalidatePath } from 'next/cache'
import {
  uploadToR2,
  deleteFromR2,
  objectExistsInR2,
  listR2Objects,
  getR2ObjectKey,
  getPublicUrlForObject,
} from './cloudflare-r2'

export { deleteFromR2 }
export const MEDIA_TYPES = ['photo', 'video', 'embed'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

export type DbMedia = {
  id: string
  storage_path: string | null
  public_url: string | null
  storage_provider: string | null
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

// Pages that consume media and should be revalidated after upload/delete.
const MEDIA_REVALIDATE_PATHS = ['/', '/media', '/media/photos', '/media/videos']

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

  let query = admin.from('media').select('id, storage_path, public_url, storage_provider, type, provider, alt_en, alt_bn, caption_en, caption_bn, width, height, filesize, category, created_by, created_at', { count: 'exact' })

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
    .select('id, storage_path, public_url, storage_provider, type, provider, alt_en, alt_bn, caption_en, caption_bn, width, height, filesize, category, created_by, created_at')
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

// Result of a complete media deletion attempt.
export type DeleteMediaResult =
  | { ok: true; storageDeleted: boolean; dbDeleted: true; storagePath: string | null; albumPhotoCount: number }
  | { ok: true; storageDeleted: false; dbDeleted: true; storagePath: string | null; albumPhotoCount: number; storageError: string }
  | { ok: false; error: string; storagePath: string | null; dbDeleted: boolean }

// Delete R2 object first, then database record, then album_photos.
// If R2 deletion fails, the database record is NOT deleted.
export async function deleteMedia(id: string): Promise<DeleteMediaResult> {
  const admin = getAdminSupabase()
  const item = await getMedia(id)
  if (!item) return { ok: false, error: 'Media not found.', storagePath: null, dbDeleted: false }

  const storagePath = item.storage_path ?? null

  // Determine which storage system to delete from.
  if (item.storage_provider === 'cloudflare_r2' && storagePath) {
    // Step 1: Delete from Cloudflare R2.
    const deleteResult = await deleteFromR2(storagePath)
    if (!deleteResult.ok) {
      return { ok: false, error: deleteResult.error || 'Failed to delete R2 object.', storagePath, dbDeleted: false }
    }
  } else if (item.storage_provider === 'supabase_storage' && storagePath) {
    // Legacy: delete from Supabase Storage for old records.
    try {
      const { error: storageError } = await admin.storage.from('public-media').remove([storagePath])
      if (storageError) {
        return { ok: false, error: `Failed to delete legacy storage object: ${storageError.message}`, storagePath, dbDeleted: false }
      }
    } catch (err) {
      return { ok: false, error: `Failed to delete legacy storage object: ${(err as Error).message}`, storagePath, dbDeleted: false }
    }
  }

  // Step 2: Get album_photos count and delete relationships.
  const { data: albumPhotos } = await admin.from('album_photos').select('id').eq('media_id', id)
  const albumPhotoCount = (albumPhotos ?? []).length

  const { error: albumPhotoError } = await admin.from('album_photos').delete().eq('media_id', id)
  if (albumPhotoError) {
    logError('media.delete-album-photos', albumPhotoError)
  }

  // Step 3: Delete the database record.
  const { error: dbError } = await (admin.from('media') as any).delete().eq('id', id)
  if (dbError) {
    logError('media.delete-db', dbError)
    return { ok: false, error: `Failed to delete database record: ${dbError.message}`, storagePath, dbDeleted: false }
  }

  revalidatePaths()

  return {
    ok: true,
    storageDeleted: true,
    dbDeleted: true,
    storagePath,
    albumPhotoCount
  }
}

// Upload file to Cloudflare R2 and create media record.
export async function uploadMediaFile(file: File, buffer: Buffer, contentType: string): Promise<{ storagePath: string; publicUrl: string }> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const type = (file.type.startsWith('image/') ? 'photo' : file.type.startsWith('video/') ? 'video' : 'media') as 'photo' | 'video' | 'media'
  const objectKey = getR2ObjectKey(type, file.name, ext)

  await uploadToR2(objectKey, buffer, contentType)

  const publicUrl = getPublicUrlForObject(objectKey)
  return { storagePath: objectKey, publicUrl }
}

// Find orphaned files in R2 that have no corresponding media record.
export async function findOrphanFiles(): Promise<Array<{ name: string; fullName: string; storagePath: string }>> {
  const admin = getAdminSupabase()
  const orphans: Array<{ name: string; fullName: string; storagePath: string }> = []

  try {
    const mediaRows = await admin.from('media').select('storage_path, storage_provider')
    const rows = (mediaRows?.data ?? []) as any[]
    const referencedPaths = new Set(rows.map((r: any) => r.storage_path).filter((p: string) => p && p !== null))

    const r2Keys = await listR2Objects('photos/')
    const r2VideoKeys = await listR2Objects('videos/')
    const allR2Keys = [...r2Keys, ...r2VideoKeys]

    for (const key of allR2Keys) {
      if (!referencedPaths.has(key)) {
        orphans.push({
          name: key.split('/').pop() || key,
          fullName: key,
          storagePath: key
        })
      }
    }
  } catch (err) {
    logError('media.orphan-scan', err)
  }

  return orphans
}

// Delete orphaned files from R2 after explicit admin confirmation.
export async function deleteOrphanFiles(paths: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
  let deleted = 0
  let failed = 0
  const errors: string[] = []

  for (const path of paths) {
    const result = await deleteFromR2(path)
    if (result.ok) {
      deleted++
    } else {
      failed++
      errors.push(`${path}: ${result.error}`)
    }
  }

  if (deleted > 0) {
    revalidatePaths()
  }

  return { deleted, failed, errors }
}

export async function getOrphanCount(): Promise<number> {
  const orphans = await findOrphanFiles()
  return orphans.length
}

// Check if an object exists in R2.
export async function checkR2ObjectExists(objectKey: string): Promise<boolean> {
  return objectExistsInR2(objectKey)
}

function revalidatePaths(): void {
  for (const path of MEDIA_REVALIDATE_PATHS) {
    try {
      revalidatePath(path)
    } catch {
      // best-effort
    }
  }
}
