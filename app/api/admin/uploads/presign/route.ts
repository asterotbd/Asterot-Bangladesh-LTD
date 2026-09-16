import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, parseJsonBody } from '../../../../../lib/api-utils'
import { presignPut, isR2Enabled } from '../../../../../lib/r2'
import { newUploadKey } from '../../../../../lib/media-server'
import { IMAGE_MIME_BY_EXT, MAX_FILES_PER_UPLOAD, describeImageProblem, imageExtension } from '../../../../../lib/uploadRules'

export const dynamic = 'force-dynamic'

// Step 1 of a direct upload: hand the browser a short-lived, single-object PUT
// URL per file. The file itself goes straight to R2 and never passes through
// this function, so Vercel's 4.5 MB request-body limit does not apply.
// Step 2 is /api/admin/uploads/complete, which validates what actually landed.
export async function POST(request: Request) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isR2Enabled()) return jsonError('Image storage is not configured.', 503)

  const body = await parseJsonBody(request)
  const files = body && typeof body === 'object' && !Array.isArray(body) ? (body as { files?: unknown }).files : undefined
  if (!Array.isArray(files) || files.length === 0) return jsonError('No files to upload.', 400)
  if (files.length > MAX_FILES_PER_UPLOAD) return jsonError(`Upload at most ${MAX_FILES_PER_UPLOAD} files at a time.`, 400)

  const uploads = files.map((entry, index) => {
    const { name, size } = (entry && typeof entry === 'object' ? entry : {}) as { name?: unknown; size?: unknown }
    if (typeof name !== 'string' || typeof size !== 'number' || !Number.isFinite(size)) {
      return { index, error: 'Invalid file entry.' }
    }
    const problem = describeImageProblem({ name, size })
    if (problem) return { index, name, error: problem }

    // The content type is derived from the extension, never taken from the
    // client, and is baked into the signature.
    const ext = imageExtension(name) as string
    const key = newUploadKey(ext)
    const { url, headers } = presignPut(key, IMAGE_MIME_BY_EXT[ext])
    return { index, name, key, url, headers }
  })

  return NextResponse.json({ uploads })
}
