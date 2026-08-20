import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { getContactMessage, updateContactMessageStatus, CONTACT_STATUSES } from '../../../../../lib/contact-server'
import { writeAuditLog } from '../../../../../lib/audit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('contact.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid message ID.', 400)
  try {
    const message = await getContactMessage(params.id)
    if (!message) return jsonError('Message not found.', 404)
    return NextResponse.json({ data: message })
  } catch (err) {
    logError('admin.messages.get', err)
    return jsonError('Unable to load the message.', 500)
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('contact.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.contactMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.contactMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) return jsonError('Invalid message ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => key !== 'status')
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !(CONTACT_STATUSES as readonly string[]).includes(status)) {
    return jsonError('Invalid status.', 400)
  }

  try {
    const updated = await updateContactMessageStatus(params.id, status as (typeof CONTACT_STATUSES)[number])
    if (!updated) return jsonError('Message not found.', 404)
    await writeAuditLog(check.user.id, 'contact.status', 'contact_messages', params.id, { status })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.messages.update', err)
    return jsonError('Unable to update the message.', 500)
  }
}
