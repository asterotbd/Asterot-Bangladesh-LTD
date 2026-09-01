import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { updateUserProfile } from '../../../../../lib/users-server'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

const EDITABLE_FIELDS = ['display_name', 'full_name', 'locale', 'phone', 'bio'] as const

const FIELD_MAX_LENGTH: Record<(typeof EDITABLE_FIELDS)[number], number> = {
  display_name: 120,
  full_name: 160,
  locale: 16,
  phone: 30,
  bio: 500
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('users.manage')
  if (!check.ok) return jsonError(check.message, check.status)

  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.userProfileMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.userProfileMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) {
    return jsonError('Invalid user ID.', 400)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Invalid payload.', 400)
  }
  if (Object.keys(body).length === 0) {
    return jsonError('Invalid payload.', 400)
  }

  const unknown = Object.keys(body).filter((key) => !EDITABLE_FIELDS.includes(key as typeof EDITABLE_FIELDS[number]))
  if (unknown.length > 0) {
    return jsonError('Invalid payload field.', 400)
  }

  const fields: Record<string, string | null> = {}
  for (const key of EDITABLE_FIELDS) {
    if (!(key in body)) continue
    const value = (body as Record<string, unknown>)[key]
    if (value === null) {
      fields[key] = null
      continue
    }
    if (typeof value !== 'string') {
      return jsonError('Invalid profile value.', 400)
    }
    if (value.trim().length > FIELD_MAX_LENGTH[key]) {
      return jsonError(`Invalid profile value: ${key} is too long.`, 400)
    }
    fields[key] = value
  }

  let updated: boolean
  try {
    updated = await updateUserProfile(params.id, fields)
  } catch (err) {
    logError('admin.users.update', err)
    if (err instanceof Error && err.message.startsWith('Invalid ')) {
      return jsonError('Invalid profile value.', 400)
    }
    return jsonError('Unable to update this profile.', 500)
  }

  if (!updated) {
    return jsonError('User not found.', 404)
  }
  return NextResponse.json({ ok: true })
}