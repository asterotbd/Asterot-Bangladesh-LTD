import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'
import { jsonError, logError } from '../../../../lib/api-utils'
import { writeAuditLog } from '../../../../lib/audit'
import { createMedia, uploadMediaFile, validateUploadedVideo, deleteStorageFile } from '../../../../lib/media-server'

export const dynamic = 'force-dynamic'

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
  if (file.size > 100 * 1024 * 1024) return jsonError('File is too large (max 100 MB).', 400)
  if (!file.type.startsWith('video/')) return jsonError('Only video files are supported.', 400)

  let buffer: Buffer
  let validated
  try {
    buffer = Buffer.from(await file.arrayBuffer())
    validated = validateUploadedVideo(file, buffer)
  } catch {
    return jsonError('Unable to read the uploaded file.', 400)
  }
  if (!validated.ok) return jsonError(validated.error, 400)

  const caption_en = (formData.get('caption_en') as string || '').trim() || null
  const category = (formData.get('category') as string || '').trim() || null

  try {
    const { storagePath, publicUrl } = await uploadMediaFile(file, buffer, validated.contentType)
    
    try {
      const record = await createMedia({
        storage_path: storagePath,
        public_url: publicUrl,
        storage_provider: 'cloudflare_r2',
        type: 'video',
        provider: 'uploaded',
        caption_en,
        category,
        filesize: file.size,
        created_by: check.user.id
      })
      if (!record) {
        await deleteStorageFile(storagePath)
        return jsonError('Unable to create media record.', 500)
      }
      await writeAuditLog(check.user.id, 'media.video-upload', 'media', record.id, { filename: file.name, size: file.size })
      return NextResponse.json({ data: record }, { status: 201 })
    } catch (err) {
      // The R2 upload above already succeeded, so on any DB failure the
      // object must be cleaned up here or it is orphaned with no DB row to
      // ever reference it again (deleteStorageFile logs its own failures and
      // never throws, so it can't mask the original error below).
      await deleteStorageFile(storagePath)
      logError('admin.media-video.upload-db-fail', err)
      throw err
    }
  } catch (err) {
    logError('admin.media-video.upload', err)
    return jsonError('Unable to upload the video.', 500)
  }
}
