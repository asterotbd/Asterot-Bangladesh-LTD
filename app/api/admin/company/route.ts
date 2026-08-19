import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { validateCompanyPayload } from '../../../../lib/api-validation'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireApiPermission('company.view')
  if (!check.ok) return jsonError(check.message, check.status)
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('company_info').select('*').limit(1).maybeSingle()
  if (error) {
    logError('admin.company.get', error)
    return jsonError('Unable to load company information.', 500)
  }
  return NextResponse.json({ data })
}

export async function PUT(request: Request) {
  const check = await requireApiPermission('company.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.companyMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.companyMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  const result = validateCompanyPayload(body)
  if ('error' in result) return jsonError(result.error, 400)
  const fields = result.fields

  const admin = getAdminSupabase()
  const userId = check.user.id
  const payload = {
    ...fields,
    updated_at: new Date().toISOString(),
    created_by: userId
  }
  const { data, error } = await admin.from('company_info').upsert(payload as any, { onConflict: 'id' }).select().maybeSingle()
  if (error) {
    logError('admin.company.update', error)
    return jsonError('Unable to update company information.', 500)
  }
  return NextResponse.json({ data })
}