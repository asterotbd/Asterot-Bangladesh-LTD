import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'
import { jsonError, logError } from '../../../../lib/api-utils'
import { listMedia, createMedia, uploadMediaFile, validateUploadedImage, deleteStorageFile, MEDIA_TYPES } from '../../../../lib/media-server'
import { writeAuditLog } from '../../../../lib/audit'
import { getAlbum, listAlbumPhotos, addPhotoToAlbum } from '../../../../lib/albums-server'

const TEXT_MAX: Record<string, number> = {
  alt_en: 300,
  caption_en: 500,
  category: 120
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)

  const url = new URL(request.url)
  const rawPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const rawPerPage = Number.parseInt(url.searchParams.get('perPage') ?? '24', 10)
  const perPage = Number.isFinite(rawPerPage) && rawPerPage > 0 ? rawPerPage : 24
  const type = (url.searchParams.get('type') ?? '').trim()
  const q = (url.searchParams.get('q') ?? '').trim()

  try {
    const result = await listMedia({ page, perPage, search: q, type })
    return NextResponse.json({ data: result.items, total: result.total, totalPages: result.totalPages })
  } catch (err) {
    logError('admin.media.list', err)
    return jsonError('Unable to load media.', 500)
  }
}

type CleanedText = { ok: true; value: string | null } | { ok: false }

function cleanText(value: unknown, max: number): CleanedText {
  if (value === null || value === undefined) return { ok: true, value: null }
  if (typeof value !== 'string') return { ok: false }
  const trimmed = value.trim()
  if (trimmed === '') return { ok: true, value: null }
  if (trimmed.length > max) return { ok: false }
  return { ok: true, value: trimmed }
}

export async function POST(request: Request) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError('Invalid multipart payload.', 400)
  }

  const albumId = formData.get('albumId')
  const files = formData.getAll('files')

  if (!albumId || !(albumId instanceof FileList || typeof albumId === 'string')) {
    return jsonError('Album is required.', 400)
  }
  if (typeof albumId !== 'string') {
    return jsonError('Album is required.', 400)
  }

  if (!files || files.length === 0) {
    return jsonError('No files uploaded.', 400)
  }

  if (files.length > 50) {
    return jsonError('Maximum 50 files per batch upload.', 400)
  }

  // Validate album exists
  const album = await getAlbum(albumId)
  if (!album) return jsonError('Album not found.', 404)
  if (!album.id) return jsonError('Album not found.', 404)
  const albumIdValid = album.id

  // Process each file
  const results: Array<{ name: string; ok: boolean; error?: string; mediaId?: string }> = []
  const mediaIds: string[] = []

  // Helper to safely get a text field from form data by name
  const getTextField = (formData: FormData, name: string): { ok: true; value: string } | { ok: false } => {
    const value = formData.get(name)
    if (value === null || value === undefined) return { ok: true, value: '' }
    if (typeof value !== 'string') return { ok: false }
    return { ok: true, value: value }
  }

  // Process files sequentially to manage errors per-file
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileIndex = i + 1

    // Type-safe file access
    const uploadFile = file instanceof File ? file : null
    if (!uploadFile) {
      results.push({
        name: String(file),
        ok: false,
        error: 'Invalid file entry.'
      })
      continue
    }

    try {
      // Validate file size (max 15 MB)
      if (uploadFile.size > 15 * 1024 * 1024) {
        results.push({
          name: uploadFile.name,
          ok: false,
          error: `${uploadFile.name} is larger than the 15 MB limit.`
        })
        continue
      }

      // Read buffer and validate image
      let buffer: Buffer
      let validated
      try {
        buffer = Buffer.from(await uploadFile.arrayBuffer())
        validated = validateUploadedImage(uploadFile, buffer)
      } catch {
        results.push({
          name: uploadFile.name,
          ok: false,
          error: `Unable to read ${uploadFile.name}.`
        })
        continue
      }
      if (!validated.ok) {
        results.push({
          name: uploadFile.name,
          ok: false,
          error: validated.error
        })
        continue
      }

      // Upload file to storage
      try {
        const { storagePath, publicUrl } = await uploadMediaFile(uploadFile, buffer, validated.contentType)

        // Get form fields for this file
        const altFields = getTextField(formData, `alt_${uploadFile.name}`)
        const captionFields = getTextField(formData, `caption_${uploadFile.name}`)
        const categoryFields = getTextField(formData, `category_${uploadFile.name}`)

        if (!altFields.ok || !captionFields.ok || !categoryFields.ok) {
          // Clean up uploaded file if metadata validation fails
          await deleteStorageFile(storagePath)
          results.push({
            name: uploadFile.name,
            ok: false,
            error: 'Invalid form data.'
          })
          continue
        }

        const record = await createMedia({
          storage_path: storagePath,
          public_url: publicUrl,
          type: 'photo',
          provider: 'uploaded',
          alt_en: altFields.value,
          caption_en: captionFields.value,
          filesize: uploadFile.size,
          category: categoryFields.value,
          created_by: check.user.id
        })

        if (!record) {
          // Clean up uploaded file if metadata insert fails
          await deleteStorageFile(storagePath)
          results.push({
            name: uploadFile.name,
            ok: false,
            error: 'Unable to create media record.'
          })
          continue
        }

        // Associate with album
        try {
          const ok = await addPhotoToAlbum(albumIdValid, record.id)
          if (!ok) {
            logError('media-batch.album-assoc', `Failed to associate media ${record.id} with album ${albumIdValid}`)
          }
        } catch (albumErr) {
          logError('media-batch.album-assoc', albumErr)
        }

        mediaIds.push(record.id)
        results.push({
          name: uploadFile.name,
          ok: true,
          mediaId: record.id
        })
      } catch (uploadErr) {
        results.push({
          name: uploadFile.name,
          ok: false,
          error: `Upload failed for ${uploadFile.name}: ${(uploadErr as Error).message}`
        })
      }
    } catch (err) {
      logError('admin.media-batch-single', err)
      results.push({
        name: uploadFile.name,
        ok: false,
        error: `Unexpected error for ${uploadFile.name}.`
      })
    }
  }

  // Summary
  const successful = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length

  if (successful > 0) {
    await writeAuditLog(check.user.id, 'media-batch-upload', 'media', '', {
      albumId: albumIdValid,
      total: files.length,
      successful,
      failed,
      fileNames: results.map(r => r.name)
    })
  }

  return NextResponse.json({
    success: failed === 0,
    albumId: albumIdValid,
    total: files.length,
    successful,
    failed,
    results,
    mediaIds
  })
}