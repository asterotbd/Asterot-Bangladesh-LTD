import { NextResponse } from 'next/server'
import createServerClient from '../../../../lib/supabaseServer'
import { getUserRoles } from '../../../../lib/auth'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { getAllNews, NEWS_ADMIN_ROLES } from '../../../../lib/news-server'
import { slugify } from '../../../../lib/events-server'

export const dynamic = 'force-dynamic'

async function requireAdminSession() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    return { ok: false, status: 401, message: 'Not authenticated' }
  }
  const roles = await getUserRoles(session.user.id)
  const allowed = (roles || []).some((r: any) => NEWS_ADMIN_ROLES.includes(String(r)))
  if (!allowed) return { ok: false, status: 403, message: 'Forbidden' }
  return { ok: true, session }
}

export async function GET() {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const news = await getAllNews()
  return NextResponse.json({ data: news })
}

const ALLOWED_FIELDS = [
  'title_en',
  'title_bn',
  'slug',
  'subtitle_en',
  'subtitle_bn',
  'excerpt_en',
  'excerpt_bn',
  'content_en',
  'content_bn',
  'category_id',
  'published',
  'published_at'
] as const

function pickNewsFields(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const source = body as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in source) out[key] = source[key]
  }
  return out
}

export async function POST(request: Request) {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const body = await request.json().catch(() => null)
  const fields = pickNewsFields(body)
  if (!fields || typeof fields.title_en !== 'string' || !fields.title_en.trim()) {
    return NextResponse.json({ error: 'title_en is required.' }, { status: 400 })
  }
  if (typeof fields.slug !== 'string' || !fields.slug.trim()) {
    fields.slug = slugify(fields.title_en)
  }
  if (typeof fields.slug !== 'string' || !fields.slug.trim()) {
    return NextResponse.json({ error: 'A valid slug is required.' }, { status: 400 })
  }

  const admin = getAdminSupabase()
  const userId = (check.session as any).user.id
  const published = Boolean(fields.published)
  const payload = {
    ...fields,
    published,
    published_at: published
      ? (typeof fields.published_at === 'string' && fields.published_at ? fields.published_at : new Date().toISOString())
      : (fields.published_at ?? null),
    author_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const { data, error } = await admin.from('news').insert(payload as any).select().single()
  if (error) {
    if (String(error.message).includes('duplicate key') || String(error.message).includes('unique')) {
      return NextResponse.json({ error: 'A news article with this slug already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
