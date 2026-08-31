import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiPermission } from '../../../../lib/auth'
import { listSettings, upsertSetting, deleteSetting } from '../../../../lib/settings-server'
import { writeAuditLog } from '../../../../lib/audit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

const SETTING_KEY_RE = /^[a-z0-9][a-z0-9_.-]{0,63}$/i

export async function GET() {
  const check = await requireApiPermission('settings.view')
  if (!check.ok) return jsonError(check.message, check.status)
  try {
    const settings = await listSettings()
    return NextResponse.json({ data: settings })
  } catch (err) {
    logError('admin.settings.list', err)
    return jsonError('Unable to load settings.', 500)
  }
}

export async function PUT(request: Request) {
  const check = await requireApiPermission('settings.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.settingsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.settingsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => key !== 'key' && key !== 'value')
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  const key = (body as Record<string, unknown>).key
  const value = (body as Record<string, unknown>).value
  if (typeof key !== 'string' || !SETTING_KEY_RE.test(key)) return jsonError('Invalid key.', 400)

  try {
    await upsertSetting(key, value ?? null)
    await writeAuditLog(check.user.id, 'settings.update', 'site_settings', null, { key })
    revalidatePath('/')
    revalidatePath('/news')
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.settings.update', err)
    return jsonError('Unable to update settings.', 500)
  }
}

export async function DELETE(request: Request) {
  const check = await requireApiPermission('settings.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.settingsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.settingsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const id = (body as Record<string, unknown>).id
  if (typeof id !== 'string' || !isValidUuid(id)) return jsonError('Invalid setting ID.', 400)

  try {
    const deleted = await deleteSetting(id)
    if (!deleted) return jsonError('Setting not found.', 404)
    await writeAuditLog(check.user.id, 'settings.delete', 'site_settings', id)
    revalidatePath('/')
    revalidatePath('/news')
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.settings.delete', err)
    return jsonError('Unable to delete the setting.', 500)
  }
}