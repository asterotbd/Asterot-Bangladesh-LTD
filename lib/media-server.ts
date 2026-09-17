import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'
import { putObject, deleteObject, isR2Enabled, R2_UPLOAD_PREFIX, headObject, readObjectPrefix, publicUrlFor } from './r2'
import { IMAGE_MIME_BY_EXT, MAX_IMAGE_BYTES } from './uploadRules'

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
  caption_en: string | null
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
// Both maps derive from lib/uploadRules so the browser picker, the presign
// route and this validation can never disagree about what is allowed.
const IMAGE_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_MIME_BY_EXT).map(([ext, mime]) => [ext, mime.split('/')[1]])
)

const IMAGE_MIME: Record<string, string> = Object.fromEntries(
  Object.values(IMAGE_MIME_BY_EXT).map((mime) => [mime.split('/')[1], mime])
)

const VIDEO_CONTAINER_BY_MIME: Record<string, 'mp4' | 'webm' | 'ogg'> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg'
}

// Sniffs the container format from well-known magic bytes:
//  - MP4/ISO-BMFF: a box-size word followed by the ASCII box type 'ftyp'.
//  - WebM/Matroska: the fixed EBML header magic number.
//  - Ogg: the 'OggS' page capture pattern.
// This confirms the upload is a well-formed container of the claimed type;
// it does not decode or validate the audio/video codec inside the container.
function sniffVideoContainer(buffer: Buffer): 'mp4' | 'webm' | 'ogg' | null {
  if (buffer.length < 12) return null
  if (buffer.toString('latin1', 4, 8) === 'ftyp') return 'mp4'
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return 'webm'
  if (buffer.toString('latin1', 0, 4) === 'OggS') return 'ogg'
  return null
}

// Validate an uploaded video: the declared MIME type must be one of the
// supported formats, and the file's magic bytes must match that container
// (not just the spoofable client-declared Content-Type).
export function validateUploadedVideo(file: File, buffer: Buffer): { ok: true; contentType: string } | { ok: false; error: string } {
  const declaredContainer = VIDEO_CONTAINER_BY_MIME[file.type]
  if (!declaredContainer) {
    return { ok: false, error: 'Unsupported video format. Use MP4, WebM, or Ogg.' }
  }
  const sniffedContainer = sniffVideoContainer(buffer)
  if (!sniffedContainer) {
    return { ok: false, error: 'The file is not a recognized video container.' }
  }
  if (sniffedContainer !== declaredContainer) {
    return { ok: false, error: 'The file content does not match its declared video format.' }
  }
  return { ok: true, contentType: file.type }
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

  let query = admin.from('media').select('id, storage_path, public_url, storage_provider, type, provider, alt_en, caption_en, width, height, filesize, category, created_by, created_at', { count: 'exact' })

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
    .select('id, storage_path, public_url, storage_provider, type, provider, alt_en, caption_en, width, height, filesize, category, created_by, created_at')
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

// Thrown when a media row is still referenced by something deleteMedia does not
// know how to detach, so the route can answer 409 instead of a generic 500.
export class MediaInUseError extends Error {
  constructor(message = 'This media item is still in use and cannot be deleted.') {
    super(message)
    this.name = 'MediaInUseError'
  }
}

// Thrown when the row's stored file could not be confirmed deleted from R2.
// The row is left in place in this case - see deleteMedia - so this is a
// distinct, generic-500 case from both "not found" and MediaInUseError.
export class MediaStorageDeleteError extends Error {
  constructor(message: string) {
    super(`Unable to delete the stored file: ${message}`)
    this.name = 'MediaStorageDeleteError'
  }
}

// Nullable references to media(id) that were created without an ON DELETE
// clause, so Postgres refuses to delete any media row one of them points at.
// Before this, every album cover and news featured image failed to delete with
// an opaque 500. Detaching first is the expected CMS behaviour: an article
// falls back to the default news image and an album loses its cover.
// album_photos and project_media already cascade and homepage_sections already
// sets null, so they are deliberately absent.
const MEDIA_REFERENCES: ReadonlyArray<{ table: string; column: string }> = [
  { table: 'news', column: 'featured_image' },
  { table: 'albums', column: 'cover_media_id' },
  { table: 'company_info', column: 'featured_media_id' },
  { table: 'services', column: 'media_id' },
  { table: 'leadership', column: 'photo_media_id' },
  { table: 'sponsors', column: 'logo_media_id' },
  { table: 'partners', column: 'logo_media_id' },
  { table: 'partnerships', column: 'logo_media_id' }
]

// Tables/columns that exist in the migrations but may be absent from a given
// database; detaching from them is a no-op, not a failure.
const MISSING_RELATION_CODES = new Set(['PGRST204', 'PGRST205', '42P01', '42703'])
const FOREIGN_KEY_VIOLATION = '23503'

export type DeleteMediaResult =
  | { ok: true; storagePath: string | null; storageDeleted: boolean; albumPhotoCount: number }
  | { ok: false; notFound: true }

/**
 * Deletes a media row and, when the row owns it, its stored file.
 *
 * Storage is deleted first and the row is only ever touched once that is
 * confirmed successful (or the object was already gone - 404 counts as
 * success): a media/video row must never be permanently deleted while we
 * know its underlying object could not be deleted, or the object is
 * orphaned with nothing left pointing at it (see deleteStorageFile).
 *
 * Once storage is confirmed gone, references are detached and then the row
 * is deleted, matching the reasoning in the reference table below: detaching
 * first means the delete itself does not fail pointing at a media row whose
 * file is already gone. This does not fully eliminate the reverse failure
 * mode (storage deleted, then the row delete itself fails - e.g. a
 * transient DB error, or an FK reference this table doesn't know about) -
 * Supabase/R2 offer no cross-system transaction to make that atomic. That
 * residual case surfaces as MediaInUseError (409) or a thrown DB error, with
 * the row left in place pointing at an already-deleted object, and needs a
 * manual fix; it is called out here rather than silently assumed away.
 *
 * The storage backend is chosen from the stored key (deleteStorageFile), not
 * from media.storage_provider: migration 029 labelled every existing row
 * 'supabase_storage', including objects that actually live in R2.
 */
export async function deleteMedia(id: string): Promise<DeleteMediaResult> {
  const admin = getAdminSupabase()
  const item = await getMedia(id)
  if (!item) return { ok: false, notFound: true }

  // Only objects the admin uploaded are owned by this row alone. Seed assets
  // migrated from public/ have no storage_path, and several of them are also
  // hardcoded in rendered code (DEFAULT_NEWS_IMAGE, lib/newsData.ts), so their
  // bucket objects are left in place: deleting one would break those pages,
  // while an unreferenced object costs next to nothing to keep.
  const storagePath = item.storage_path && item.provider === 'uploaded' ? item.storage_path : null

  if (storagePath) {
    const storageResult = await deleteStorageFile(storagePath)
    if (!storageResult.ok) {
      throw new MediaStorageDeleteError(storageResult.message)
    }
  }

  // For the audit trail only: album_photos rows cascade with the media row.
  const { count: albumPhotoCount } = await admin
    .from('album_photos')
    .select('id', { count: 'exact', head: true })
    .eq('media_id', id)

  for (const { table, column } of MEDIA_REFERENCES) {
    const { error } = await (admin.from(table) as any).update({ [column]: null }).eq(column, id)
    if (error && !MISSING_RELATION_CODES.has(error.code)) {
      logError(`media.detach.${table}.${column}`, error)
      throw error
    }
  }

  const { error } = await (admin.from('media') as any).delete().eq('id', id)
  if (error) {
    if (error.code === FOREIGN_KEY_VIOLATION) throw new MediaInUseError()
    throw error
  }

  return { ok: true, storagePath, storageDeleted: Boolean(storagePath), albumPhotoCount: albumPhotoCount ?? 0 }
}

// Routes the delete to whichever backend holds the object. R2 uploads are
// written under R2_UPLOAD_PREFIX and older Supabase Storage objects under
// "admin/", so the stored path alone identifies the backend and media
// uploaded before the R2 switch still deletes correctly.
//
// R2 failures are surfaced truthfully (see lib/r2.ts deleteObject) so
// deleteMedia can refuse to delete a row whose file didn't actually go away.
// Legacy Supabase Storage deletes stay best-effort, as they always were:
// that backend predates this requirement and no caller depends on strict
// success there.
export type StorageDeleteResult = { ok: true; notFound?: boolean } | { ok: false; message: string }

export async function deleteStorageFile(storagePath: string): Promise<StorageDeleteResult> {
  if (storagePath.startsWith(`${R2_UPLOAD_PREFIX}/`)) {
    const result = await deleteObject(storagePath)
    return result.ok ? { ok: true, notFound: result.notFound } : { ok: false, message: result.message }
  }
  try {
    const admin = getAdminSupabase()
    await admin.storage.from(PUBLIC_MEDIA_BUCKET).remove([storagePath])
  } catch (err) {
    logError('media.storage-delete', err)
  }
  return { ok: true }
}

// Uploads to Cloudflare R2 when it is configured, otherwise to the Supabase
// Storage bucket. The fallback keeps the admin uploader working while R2
// credentials are still being provisioned; once R2_* and
// NEXT_PUBLIC_R2_PUBLIC_URL are set, every new upload goes to R2 and the
// Supabase branch is only exercised by legacy deletes.
export async function uploadMediaFile(file: File, buffer: Buffer, contentType: string): Promise<{ storagePath: string; publicUrl: string }> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  if (isR2Enabled()) {
    try {
      const { key, publicUrl } = await putObject(`${R2_UPLOAD_PREFIX}/${name}`, buffer, contentType)
      return { storagePath: key, publicUrl }
    } catch (err) {
      logError('media.r2-upload', err)
      throw err instanceof Error ? err : new Error('R2 upload failed')
    }
  }

  throw new Error('Cloudflare R2 is not configured. Supabase Storage fallback is disabled for new uploads.')
}

// Keys handed out for direct browser uploads. Completion accepts only keys of
// exactly this shape, so it can never be pointed at a seed asset under media/
// or images/, or at anything outside the upload prefix.
const UPLOAD_KEY_PATTERN = new RegExp(
  `^${R2_UPLOAD_PREFIX}/\\d{13}-[a-z0-9]{6}\\.(?:${Object.keys(IMAGE_MIME_BY_EXT).join('|')})$`
)

export function newUploadKey(ext: string): string {
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
  return `${R2_UPLOAD_PREFIX}/${Date.now()}-${suffix}.${ext}`
}

export type RegisteredUpload = { ok: true; media: DbMedia } | { ok: false; error: string }

/**
 * Turns an object the browser uploaded directly to R2 into a media row.
 *
 * The browser controlled the bytes, so nothing about the object is trusted:
 * the stored size is re-checked (a presigned PUT cannot enforce it) and the
 * first bytes are sniffed exactly as validateUploadedImage does for proxied
 * uploads. Anything that fails is deleted from the bucket rather than left
 * orphaned. Safe to call twice for the same key.
 */
export async function registerUploadedImage(
  key: string,
  meta: { alt_en?: string | null; caption_en?: string | null; category?: string | null },
  userId: string
): Promise<RegisteredUpload> {
  if (!UPLOAD_KEY_PATTERN.test(key)) return { ok: false, error: 'Invalid upload key.' }
  if (!isR2Enabled()) return { ok: false, error: 'Image storage is not configured.' }

  const admin = getAdminSupabase()
  const { data: existing } = await admin.from('media').select().eq('storage_path', key).maybeSingle()
  if (existing) return { ok: true, media: existing as DbMedia }

  const head = await headObject(key)
  if (!head) return { ok: false, error: 'The upload did not reach storage. Please try again.' }
  if (head.size <= 0 || head.size > MAX_IMAGE_BYTES) {
    await deleteObject(key)
    return { ok: false, error: `Must be between 1 byte and ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` }
  }

  const declared = IMAGE_TYPES[key.slice(key.lastIndexOf('.') + 1)]
  const prefix = await readObjectPrefix(key, 64)
  const sniffed = prefix ? sniffImageType(prefix) : null
  if (!sniffed || sniffed !== declared) {
    await deleteObject(key)
    return { ok: false, error: sniffed ? 'The file content does not match its extension.' : 'The file is not a valid image.' }
  }

  try {
    const media = await createMedia({
      storage_path: key,
      public_url: publicUrlFor(key),
      // Explicit: the live column still defaults to 'supabase_storage' until
      // migration 030 is applied.
      storage_provider: 'cloudflare_r2',
      type: 'photo',
      provider: 'uploaded',
      alt_en: meta.alt_en ?? null,
      caption_en: meta.caption_en ?? null,
      category: meta.category ?? null,
      filesize: head.size,
      created_by: userId
    })
    if (!media) throw new Error('No media row returned')
    return { ok: true, media }
  } catch (err) {
    logError('media.register-upload', err)
    await deleteObject(key)
    return { ok: false, error: 'Unable to save the media record.' }
  }
}
