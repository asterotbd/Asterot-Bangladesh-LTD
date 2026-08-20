import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { listHomepageSections, upsertHomepageSection, HOMEPAGE_SECTION_KEYS } from '../../../../../lib/homepage-server'

export const dynamic = 'force-dynamic'

const SECTION_FIELDS = ['section_key', 'heading', 'subtitle', 'body', 'cta_text', 'cta_url', 'image_media_id', 'visible', 'display_order'] as const

function cleanText(value: unknown, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > max ? null : trimmed
}

// Allow only safe link targets: same-origin relative paths, page anchors, and
// http(s) URLs. Rejects javascript:, data:, vbscript: and other executable
// schemes that would otherwise be stored and later rendered into an <a href>
// on the public homepage.
function cleanCtaUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length > 500) return null
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
      return trimmed
    } catch {
      return null
    }
  }
  return null
}

function cleanImageMediaId(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && isValidUuid(value)) return value
  return undefined
}

export async function GET() {
  const check = await requireApiPermission('content.view')
  if (!check.ok) return jsonError(check.message, check.status)
  try {
    const sections = await listHomepageSections()
    return NextResponse.json({ data: sections })
  } catch (err) {
    logError('admin.homepage.get', err)
    return jsonError('Unable to load homepage content.', 500)
  }
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
  const unknown = Object.keys(body).filter((key) => !SECTION_FIELDS.includes(key as (typeof SECTION_FIELDS)[number]))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  const raw = body as Record<string, unknown>
  const sectionKey = raw.section_key as string | undefined
  if (!sectionKey || !(HOMEPAGE_SECTION_KEYS as readonly string[]).includes(sectionKey)) {
    return jsonError('Invalid section key.', 400)
  }

  const heading = cleanText(raw.heading, 300)
  const subtitle = cleanText(raw.subtitle, 500)
  const bodyText = cleanText(raw.body, 5000)
  const ctaText = cleanText(raw.cta_text, 200)
  const ctaUrl = cleanCtaUrl(raw.cta_url)
  if (ctaUrl === undefined) return jsonError('Invalid CTA URL.', 400)
  const imageMediaId = cleanImageMediaId(raw.image_media_id)
  if (imageMediaId === undefined) return jsonError('Invalid image media ID.', 400)

  const visible = raw.visible === undefined ? true : Boolean(raw.visible)
  const displayOrder = Number(raw.display_order ?? 0)
  const safeOrder = Number.isFinite(displayOrder) && displayOrder >= 0 ? Math.floor(displayOrder) : 0

  try {
    await upsertHomepageSection(sectionKey, {
      heading,
      subtitle,
      body: bodyText,
      cta_text: ctaText,
      cta_url: ctaUrl,
      image_media_id: imageMediaId,
      visible,
      display_order: safeOrder
    })
    await writeAuditLog(check.user.id, 'content.update', 'homepage', null, { section: sectionKey })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.homepage.update', err)
    return jsonError('Unable to save homepage content.', 500)
  }
}