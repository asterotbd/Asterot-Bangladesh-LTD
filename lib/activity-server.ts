import getAdminSupabase, { getAuthAdminSupabase } from './supabaseAdmin'

export type DbAuditLog = {
  id: string
  actor_id: string | null
  action: string | null
  resource: string | null
  resource_id: string | null
  meta: Record<string, unknown> | null
  created_at: string | null
}

export type AuditListResult = {
  logs: (DbAuditLog & { actor_email: string | null })[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export const AUDIT_ACTIONS = [
  'user_roles.assign',
  'user_roles.remove',
  'contact.status',
  'events.create',
  'events.update',
  'events.delete',
  'news.create',
  'news.update',
  'news.delete',
  'media.upload',
  'media.update',
  'media.delete',
  'media.video.update',
  'media.video.delete',
  'settings.update',
  'settings.delete',
  'roles.update',
  'faq.create',
  'faq.update',
  'faq.delete',
  'content.update',
  'albums.create',
  'albums.update',
  'albums.delete',
  'albums.add_photo',
  'albums.add_photos',
  'albums.reorder'
] as const

export async function listAuditLogs({
  page = 1,
  perPage = 20,
  action = '',
  search = ''
}: {
  page?: number
  perPage?: number
  action?: string
  search?: string
}): Promise<AuditListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let query = admin.from('audit_logs').select('id, actor_id, action, resource, resource_id, meta, created_at', { count: 'exact' })
  if (action && (AUDIT_ACTIONS as readonly string[]).includes(action)) {
    query = query.eq('action', action)
  }
  const term = search.trim()
  if (term) {
    query = query.or(`resource.ilike.%${term.replace(/[%_]/g, (m) => `\\${m}`)}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const rows = (data ?? []) as DbAuditLog[]
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])]

  const emails = await resolveActorEmails(actorIds)
  const total = count ?? 0
  return {
    logs: rows.map((log) => ({ ...log, actor_email: log.actor_id ? (emails.get(log.actor_id) ?? null) : null })),
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

async function resolveActorEmails(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)]
  if (uniqueIds.length === 0) return new Map()
  const admin = getAuthAdminSupabase()
  const { data, error } = await admin.from('users').select('id, email').in('id', uniqueIds)
  const map = new Map<string, string>()
  if (error) {
    console.error('resolveActorEmails error', error.message)
    return map
  }
  for (const row of (data ?? []) as { id: string; email: string | null }[]) {
    if (row.email) map.set(row.id, row.email)
  }
  return map
}
