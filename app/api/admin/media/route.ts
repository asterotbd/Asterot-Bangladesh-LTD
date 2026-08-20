import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { listMedia, createMedia, uploadMediaFile, validateUploadedImage, MEDIA_TYPES } from '../../../../lib/media-server'
import { writeAuditLog } from '../../../../lib/audit'
import { jsonError, logError } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

const TEXT_MAX: Record<string, number> = {
  alt_en: 300,
  alt_bn: 300,
  caption_en: 500,
  caption_bn: 500,
  category: 120
}

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

  const file = formData.get('file')
  if (!(file instanceof File)) return jsonError('A file is required.', 400)
  if (file.size > 15 * 1024 * 1024) return jsonError('File is too large (max 15 MB).', 400)
  if (!file.type.startsWith('image/')) return jsonError('Only image files are supported.', 400)

  let buffer: Buffer
  let validated
  try {
    buffer = Buffer.from(await file.arrayBuffer())
    validated = validateUploadedImage(file, buffer)
  } catch {
    return jsonError('Unable to read the uploaded file.', 400)
  }
  if (!validated.ok) return jsonError(validated.error, 400)

  const alt_en = cleanText(formData.get('alt_en'), TEXT_MAX.alt_en)
  if (!alt_en.ok) return jsonError('Invalid alt_en.', 400)
  const alt_bn = cleanText(formData.get('alt_bn'), TEXT_MAX.alt_bn)
  if (!alt_bn.ok) return jsonError('Invalid alt_bn.', 400)
  const caption_en = cleanText(formData.get('caption_en'), TEXT_MAX.caption_en)
  if (!caption_en.ok) return jsonError('Invalid caption_en.', 400)
  const caption_bn = cleanText(formData.get('caption_bn'), TEXT_MAX.caption_bn)
  if (!caption_bn.ok) return jsonError('Invalid caption_bn.', 400)
  const category = cleanText(formData.get('category'), TEXT_MAX.category)
  if (!category.ok) return jsonError('Invalid category.', 400)

  try {
    const { storagePath, publicUrl } = await uploadMediaFile(file, buffer, validated.contentType)
    try {
      const record = await createMedia({
        storage_path: storagePath,
        public_url: publicUrl,
        type: 'photo',
        provider: 'uploaded',
        alt_en: alt_en.value,
        alt_bn: alt_bn.value,
        caption_en: caption_en.value,
        caption_bn: caption_bn.value,
        filesize: file.size,
        category: category.value,
        created_by: check.user.id
      })
      if (!record) return jsonError('Unable to create media record.', 500)
      await writeAuditLog(check.user.id, 'media.upload', 'media', record.id, { filename: file.name, size: file.size })
      return NextResponse.json({ data: record }, { status: 201 })
    } catch (err) {
      // The file was uploaded but the metadata insert failed: clean up the
      // orphaned object so storage does not accumulate unreferenced files.
      try {
        const admin = getAdminSupabase()
        await admin.storage.from('public-media').remove([storagePath])
      } catch {
        // best-effort cleanup; the original error is what matters
      }
      throw err
    }
  } catch (err) {
    logError('admin.media.upload', err)
    return jsonError('Unable to upload the file.', 500)
  }
}
