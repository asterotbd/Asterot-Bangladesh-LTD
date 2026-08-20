import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import getAdminSupabase from '../../../../../lib/supabaseAdmin'
import { writeAuditLog } from '../../../../../lib/audit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

const SYSTEM_ROLE_NAMES = ['super_admin', 'admin', 'editor', 'coach', 'finance'] as const

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('roles.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.rolesMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.rolesMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) return jsonError('Invalid role ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => key !== 'description')
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  const description = (body as Record<string, unknown>).description
  if (description !== null && typeof description !== 'string') return jsonError('Invalid description.', 400)
  const clean = description === null ? null : description.trim()
  if (clean !== null && clean.length > 500) return jsonError('Description is too long.', 400)

  const admin = getAdminSupabase()
  const { data: role, error: roleErr } = await admin.from('roles').select('id, name').eq('id', params.id).maybeSingle()
  if (roleErr) {
    logError('admin.roles.get', roleErr)
    return jsonError('Unable to load the role.', 500)
  }
  if (!role) return jsonError('Role not found.', 404)

  // Role names are referenced by the permission matrix and RPC allowlist, so
  // only the description (presentational) may be edited.
  if (!(SYSTEM_ROLE_NAMES as readonly string[]).includes(role.name)) {
    return jsonError('This role cannot be edited.', 403)
  }

  try {
    const { data, error } = await (admin.from('roles') as any)
      .update({ description: clean })
      .eq('id', params.id)
      .select('id')
    if (error) {
      logError('admin.roles.update', error)
      return jsonError('Unable to update the role.', 500)
    }
    if ((data ?? []).length === 0) return jsonError('Role not found.', 404)
    await writeAuditLog(check.user.id, 'roles.update', 'roles', params.id, { name: role.name, description: clean })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.roles.update', err)
    return jsonError('Unable to update the role.', 500)
  }
}