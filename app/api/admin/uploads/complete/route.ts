import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { registerUploadedImage } from '../../../../../lib/media-server'
import { getAlbum, listAlbumPhotos, addPhotoToAlbum } from '../../../../../lib/albums-server'
import { MAX_FILES_PER_UPLOAD } from '../../../../../lib/uploadRules'

export const dynamic = 'force-dynamic'

const TEXT_MAX = { alt_en: 300, caption_en: 500, category: 120 } as const
type TextField = keyof typeof TEXT_MAX

type Result = { key: string; ok: boolean; mediaId?: string; error?: string }

function optionalText(value: unknown, field: TextField): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string') return { ok: false }
  const trimmed = value.trim()
  if (trimmed.length > TEXT_MAX[field]) return { ok: false }
  return { ok: true, value: trimmed || null }
}

// Step 2 of a direct upload: the browser reports which keys it finished
// uploading. Each one is validated against the stored object and recorded as
// a media row, then optionally appended to an album.
export async function POST(request: Request) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { albumId?: unknown; uploads?: unknown }

  let albumId: string | null = null
  if (raw.albumId !== undefined && raw.albumId !== null) {
    if (typeof raw.albumId !== 'string' || !isValidUuid(raw.albumId)) return jsonError('Invalid album ID.', 400)
    albumId = raw.albumId
  }
  if (!Array.isArray(raw.uploads) || raw.uploads.length === 0) return jsonError('No uploads to complete.', 400)
  if (raw.uploads.length > MAX_FILES_PER_UPLOAD) return jsonError(`Complete at most ${MAX_FILES_PER_UPLOAD} uploads at a time.`, 400)

  try {
    let nextOrder = 0
    const alreadyInAlbum = new Set<string>()
    if (albumId) {
      const album = await getAlbum(albumId)
      if (!album) return jsonError('Album not found.', 404)
      const existing = await listAlbumPhotos(albumId)
      nextOrder = existing.length
      for (const p of existing) alreadyInAlbum.add(p.media_id)
    }

    const results: Result[] = []
    // Sequential on purpose: each item does a HEAD and a ranged GET against
    // R2, and order matters for album placement.
    for (const entry of raw.uploads) {
      const item = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>
      const key = typeof item.key === 'string' ? item.key : ''
      const alt = optionalText(item.alt_en, 'alt_en')
      const caption = optionalText(item.caption_en, 'caption_en')
      const category = optionalText(item.category, 'category')
      if (!key || !alt.ok || !caption.ok || !category.ok) {
        results.push({ key, ok: false, error: 'Invalid upload entry.' })
        continue
      }

      const registered = await registerUploadedImage(
        key,
        { alt_en: alt.value, caption_en: caption.value, category: category.value },
        check.user.id
      )
      if (!registered.ok) {
        results.push({ key, ok: false, error: registered.error })
        continue
      }

      const mediaId = registered.media.id
      if (albumId && !alreadyInAlbum.has(mediaId)) {
        try {
          await addPhotoToAlbum(albumId, mediaId, nextOrder)
          nextOrder += 1
          alreadyInAlbum.add(mediaId)
        } catch (err) {
          // The image is safely in the media library; report the album step
          // honestly instead of claiming success.
          logError('uploads.complete.album', err)
          results.push({ key, ok: false, mediaId, error: 'Uploaded to the media library, but could not be added to the album.' })
          continue
        }
      }
      results.push({ key, ok: true, mediaId })
    }

    const successful = results.filter((r) => r.ok).length
    if (successful > 0) {
      await writeAuditLog(check.user.id, 'media.upload', 'media', null, {
        count: successful,
        albumId,
        mediaIds: results.filter((r) => r.ok).map((r) => r.mediaId)
      })
    }

    return NextResponse.json({ results, successful, failed: results.length - successful })
  } catch (err) {
    logError('uploads.complete', err)
    return jsonError('Unable to complete the upload.', 500)
  }
}
