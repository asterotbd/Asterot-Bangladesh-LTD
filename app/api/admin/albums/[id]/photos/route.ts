import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../../lib/audit'
import { getAlbum, listAlbumPhotos, addPhotoToAlbum, reorderAlbumPhotos, removePhotoFromAlbum } from '../../../../../../lib/albums-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)
  try {
    const album = await getAlbum(params.id)
    if (!album) return jsonError('Album not found.', 404)
    const photos = await listAlbumPhotos(params.id)
    return NextResponse.json({ data: photos })
  } catch (err) {
    logError('admin.albums.photos.list', err)
    return jsonError('Unable to load album photos.', 500)
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => key !== 'media_id' && key !== 'mediaIds' && key !== 'order')
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const album = await getAlbum(params.id)
    if (!album) return jsonError('Album not found.', 404)

    const raw = body as { media_id?: string; mediaIds?: unknown; order?: unknown }
    const existing = await listAlbumPhotos(params.id)
    const nextOrder = existing.length

    if (raw.mediaIds !== undefined) {
      if (!Array.isArray(raw.mediaIds)) return jsonError('Invalid media IDs.', 400)
      let added = 0
      for (const mediaId of raw.mediaIds) {
        if (typeof mediaId !== 'string' || !isValidUuid(mediaId)) return jsonError('Invalid media ID.', 400)
        const exists = existing.some((p) => p.media_id === mediaId)
        if (!exists) {
          await addPhotoToAlbum(params.id, mediaId, nextOrder + added)
          added += 1
        }
      }
      if (added > 0) {
        await writeAuditLog(check.user.id, 'albums.add_photos', 'albums', params.id, { count: added, title: album.title_en })
      }
      return NextResponse.json({ ok: true, added })
    }

    if (typeof raw.media_id !== 'string' || !isValidUuid(raw.media_id)) return jsonError('Invalid media ID.', 400)
    const exists = existing.some((p) => p.media_id === raw.media_id)
    if (!exists) {
      const order = raw.order !== undefined ? Number(raw.order) : nextOrder
      const ok = await addPhotoToAlbum(params.id, raw.media_id, Number.isFinite(order) ? order : nextOrder)
      if (!ok) return jsonError('Unable to add the photo.', 500)
      await writeAuditLog(check.user.id, 'albums.add_photo', 'albums', params.id, { media_id: raw.media_id, title: album.title_en })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.albums.photos.add', err)
    return jsonError('Unable to add the photo.', 500)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { orderedIds?: unknown; album_id?: unknown }
  const orderedIds = raw.orderedIds
  if (!Array.isArray(orderedIds)) return jsonError('Invalid order payload.', 400)
  for (const id of orderedIds) {
    if (typeof id !== 'string' || !isValidUuid(id)) return jsonError('Invalid album photo ID.', 400)
  }

  try {
    await reorderAlbumPhotos(params.id, orderedIds as string[])
    await writeAuditLog(check.user.id, 'albums.reorder', 'albums', params.id, {})
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.albums.photos.reorder', err)
    return jsonError('Unable to reorder album photos.', 500)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { photoId?: unknown }
  if (typeof raw.photoId !== 'string' || !isValidUuid(raw.photoId)) return jsonError('Invalid album photo ID.', 400)

  try {
    const ok = await removePhotoFromAlbum(raw.photoId)
    if (!ok) return jsonError('Photo not found in this album.', 404)
    await writeAuditLog(check.user.id, 'albums.remove_photo', 'albums', params.id, {})
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.albums.photos.remove', err)
    return jsonError('Unable to remove the photo.', 500)
  }
}