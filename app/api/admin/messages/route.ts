import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { listContactMessages } from '../../../../lib/contact-server'
import { jsonError, logError } from '../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const check = await requireApiPermission('contact.view')
  if (!check.ok) return jsonError(check.message, check.status)

  const url = new URL(request.url)
  const rawPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const status = (url.searchParams.get('status') ?? '').trim()
  const q = (url.searchParams.get('q') ?? '').trim()

  try {
    const result = await listContactMessages({ page, perPage: 20, search: q, status })
    return NextResponse.json(result)
  } catch (err) {
    logError('admin.messages.list', err)
    return jsonError('Unable to load contact messages.', 500)
  }
}
