import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { listAuditLogs } from '../../../../lib/activity-server'
import { jsonError, logError } from '../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const check = await requireApiPermission('activity.view')
  if (!check.ok) return jsonError(check.message, check.status)

  const url = new URL(request.url)
  const rawPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const action = (url.searchParams.get('action') ?? '').trim()
  const q = (url.searchParams.get('q') ?? '').trim()

  try {
    const result = await listAuditLogs({ page, perPage: 20, action, search: q })
    return NextResponse.json(result)
  } catch (err) {
    logError('admin.activity.list', err)
    return jsonError('Unable to load activity logs.', 500)
  }
}