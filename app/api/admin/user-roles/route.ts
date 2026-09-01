import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { assignUserRole, removeUserRole, RoleManagementError } from '../../../../lib/user-roles-server'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

function errorStatus(code: RoleManagementError['code']): number {
  switch (code) {
    case 'USER_NOT_FOUND':
    case 'ROLE_NOT_FOUND':
    case 'NOT_ASSIGNED':
      return 404
    case 'DUPLICATE':
    case 'LAST_SUPER_ADMIN':
      return 409
    case 'OWN_SUPER_ADMIN':
    case 'FORBIDDEN':
      return 403
    default:
      return 500
  }
}

type Parsed = { error: string } | { userId: string; roleId: string }

async function parseBody(request: Request): Promise<Parsed> {
  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid payload.' }
  }
  const unknown = Object.keys(body).filter((key) => key !== 'userId' && key !== 'roleId')
  if (unknown.length > 0) return { error: 'Invalid payload field.' }
  const userId = (body as Record<string, unknown>).userId
  const roleId = (body as Record<string, unknown>).roleId
  if (typeof userId !== 'string' || typeof roleId !== 'string') {
    return { error: 'Invalid payload.' }
  }
  if (!isValidUuid(userId)) return { error: 'Invalid user ID.' }
  if (!isValidUuid(roleId)) return { error: 'Invalid role ID.' }
  return { userId, roleId }
}

export async function POST(request: Request) {
  const check = await requireApiPermission('roles.manage')
  if (!check.ok) {
    const message = check.status === 403 ? 'You do not have permission to manage roles.' : check.message
    return jsonError(message, check.status)
  }
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.roleAssign.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.roleAssign.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const parsed = await parseBody(request)
  if ('error' in parsed) return jsonError(parsed.error, 400)

  try {
    await assignUserRole(check.user.id, parsed.userId, parsed.roleId)
    return NextResponse.json({ ok: true })
} catch (err) {
    // Log the actual error for debugging
    logError('admin.user-roles.assign', err)
    // Return the actual error message for debugging (remove in production)
    const roleManagementError = err instanceof RoleManagementError
    const errorMessage = roleManagementError ? err.message : ((err as { message?: string })?.message || 'Unable to assign the role.')
    const errorCode = roleManagementError ? errorStatus(err.code) : 500
    return jsonError(errorMessage, errorCode)
}
}

export async function DELETE(request: Request) {
  const check = await requireApiPermission('roles.manage')
  if (!check.ok) {
    const message = check.status === 403 ? 'You do not have permission to manage roles.' : check.message
    return jsonError(message, check.status)
  }
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.roleRemove.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.roleRemove.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const parsed = await parseBody(request)
  if ('error' in parsed) return jsonError(parsed.error, 400)

  try {
    await removeUserRole(check.user.id, parsed.userId, parsed.roleId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof RoleManagementError) {
      return jsonError(err.message, errorStatus(err.code))
    }
    logError('admin.user-roles.remove', err)
    return jsonError('Unable to remove the role.', 500)
  }
}