import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import {
  getCompanyInfo,
  updateCompanyInfo,
  listLeadership,
  createLeader,
  updateLeader,
  deleteLeader
} from '../../../../../lib/about-server'

export const dynamic = 'force-dynamic'

const COMPANY_FIELDS = [
  'name_en',
  'name_bn',
  'founded_date',
  'location',
  'tagline_en',
  'tagline_bn',
  'slogan_en',
  'slogan_bn',
  'short_description_en',
  'short_description_bn',
  'long_description_en',
  'long_description_bn',
  'about_en',
  'about_bn',
  'story_en',
  'story_bn',
  'what_we_do_en',
  'what_we_do_bn',
  'approach_en',
  'approach_bn',
  'seo_title',
  'seo_description',
  'featured_media_id',
  'published'
]

const LEADER_FIELDS = [
  'name',
  'position',
  'photo_media_id',
  'short_bio_en',
  'short_bio_bn',
  'full_bio_en',
  'full_bio_bn',
  'display_order'
]

const TEXT_LIMITS: Record<string, number> = {
  name_en: 200,
  name_bn: 200,
  founded_date: 100,
  location: 300,
  tagline_en: 300,
  tagline_bn: 300,
  slogan_en: 300,
  slogan_bn: 300,
  short_description_en: 1000,
  short_description_bn: 1000,
  long_description_en: 8000,
  long_description_bn: 8000,
  about_en: 8000,
  about_bn: 8000,
  story_en: 8000,
  story_bn: 8000,
  what_we_do_en: 8000,
  what_we_do_bn: 8000,
  approach_en: 8000,
  approach_bn: 8000,
  seo_title: 200,
  seo_description: 400
}

function cleanText(value: unknown, key: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error(`Invalid ${key}.`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${key} is too long.`)
  return trimmed
}

export async function GET(request: Request) {
  const check = await requireApiPermission('content.view')
  if (!check.ok) return jsonError(check.message, check.status)
  const url = new URL(request.url)
  const resource = url.searchParams.get('resource') ?? 'company'
  if (resource === 'leadership') {
    const leaders = await listLeadership()
    return NextResponse.json({ data: leaders })
  }
  const company = await getCompanyInfo()
  return NextResponse.json({ data: company })
}

export async function PUT(request: Request) {
  const check = await requireApiPermission('content.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.homepageMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.homepageMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as Record<string, unknown>

  try {
    if (raw.resource === 'leadership') {
      const id = raw.id
      if (typeof id !== 'string' || !isValidUuid(id)) return jsonError('Invalid leader ID.', 400)
      const unknown = Object.keys(raw).filter((key) => key !== 'resource' && key !== 'id' && !LEADER_FIELDS.includes(key))
      if (unknown.length > 0) return jsonError('Invalid payload field.', 400)
      const fields: Record<string, unknown> = {}
      for (const field of LEADER_FIELDS) {
        const value = raw[field]
        if (field === 'display_order') {
          const n = Number(value ?? 0)
          fields.display_order = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
        } else if (field === 'photo_media_id') {
          if (value === null || value === '' || value === undefined) fields.photo_media_id = null
          else if (typeof value === 'string' && isValidUuid(value)) fields.photo_media_id = value
          else return jsonError('Invalid photo media ID.', 400)
        } else {
          const limit = field === 'name' ? 200 : field.startsWith('full_') ? 8000 : field.startsWith('short_') ? 2000 : 300
          fields[field] = cleanText(value, field, limit)
        }
      }
      if (!fields.name) return jsonError('A name is required.', 400)
      const ok = await updateLeader(id, fields)
      if (!ok) return jsonError('Leader not found.', 404)
      await writeAuditLog(check.user.id, 'content.update', 'leadership', id, { name: fields.name })
      return NextResponse.json({ ok: true })
    }

    if (raw.resource === 'company' || !raw.resource) {
      const company = await getCompanyInfo()
      if (!company) return jsonError('Company info not found.', 404)
      const unknown = Object.keys(raw).filter((key) => key !== 'resource' && !COMPANY_FIELDS.includes(key))
      if (unknown.length > 0) return jsonError('Invalid payload field.', 400)
      const fields: Record<string, unknown> = {}
      for (const field of COMPANY_FIELDS) {
        const value = raw[field]
        if (field === 'published') {
          fields.published = Boolean(value)
        } else if (field === 'featured_media_id') {
          if (value === null || value === '' || value === undefined) fields.featured_media_id = null
          else if (typeof value === 'string' && isValidUuid(value)) fields.featured_media_id = value
          else return jsonError('Invalid featured media ID.', 400)
        } else {
          fields[field] = cleanText(value, field, TEXT_LIMITS[field])
        }
      }
      const ok = await updateCompanyInfo(company.id, fields)
      if (!ok) return jsonError('Company info not found.', 404)
      await writeAuditLog(check.user.id, 'content.update', 'company_info', company.id, {
        name: (fields.name_en as string) ?? company.name_en
      })
      return NextResponse.json({ ok: true })
    }

    return jsonError('Invalid resource.', 400)
  } catch (err) {
    logError('admin.about.update', err)
    return jsonError('Unable to save changes.', 500)
  }
}

export async function POST(request: Request) {
  const check = await requireApiPermission('content.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.homepageMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.homepageMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as Record<string, unknown>
  if (raw.resource !== 'leadership') return jsonError('Invalid resource.', 400)

  const unknown = Object.keys(raw).filter((key) => key !== 'resource' && !LEADER_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)
  try {
    const record: Record<string, unknown> = {}
    for (const field of LEADER_FIELDS) {
      const value = raw[field]
      if (field === 'display_order') {
        const n = Number(value ?? 0)
        record.display_order = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
      } else if (field === 'photo_media_id') {
        if (value === null || value === '' || value === undefined) record.photo_media_id = null
        else if (typeof value === 'string' && isValidUuid(value)) record.photo_media_id = value
        else return jsonError('Invalid photo media ID.', 400)
      } else {
        const limit = field === 'name' ? 200 : field.startsWith('full_') ? 8000 : field.startsWith('short_') ? 2000 : 300
        record[field] = cleanText(value, field, limit)
      }
    }
    if (!record.name) return jsonError('A name is required.', 400)
    const leader = await createLeader(record)
    if (!leader) return jsonError('Unable to create the leader.', 500)
    await writeAuditLog(check.user.id, 'content.update', 'leadership', leader.id, { name: leader.name })
    return NextResponse.json({ data: leader }, { status: 201 })
  } catch (err) {
    logError('admin.about.leader-create', err)
    return jsonError('Unable to create the leader.', 500)
  }
}

export async function DELETE(request: Request) {
  const check = await requireApiPermission('content.delete')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.homepageMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.homepageMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { resource?: unknown; id?: unknown }
  if (raw.resource !== 'leadership' || typeof raw.id !== 'string' || !isValidUuid(raw.id)) return jsonError('Invalid payload.', 400)

  try {
    const ok = await deleteLeader(raw.id)
    if (!ok) return jsonError('Leader not found.', 404)
    await writeAuditLog(check.user.id, 'content.delete', 'leadership', raw.id, {})
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.about.leader-delete', err)
    return jsonError('Unable to delete the leader.', 500)
  }
}