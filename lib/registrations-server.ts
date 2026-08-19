import getAdminSupabase from './supabaseAdmin'

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled'

export type RecentRegistration = {
  id: string
  participant_name: string
  event_id: string | null
  event_title: string | null
  status: RegistrationStatus | null
  created_at: string | null
}

export type RegistrationsPerEvent = {
  event_id: string
  event_title: string | null
  count: number
}

export async function getTotalRegistrations(): Promise<number> {
  const admin = getAdminSupabase()
  const { count, error } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function getRegistrationCountsByStatus(): Promise<Record<RegistrationStatus, number>> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('registrations').select('status')
  if (error) throw error
  const counts: Record<RegistrationStatus, number> = { pending: 0, confirmed: 0, cancelled: 0 }
  for (const row of (data ?? []) as { status: string | null }[]) {
    const status = row.status as RegistrationStatus | null
    if (status && status in counts) counts[status] += 1
  }
  return counts
}

export async function getRecentRegistrations(limit = 5): Promise<RecentRegistration[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('registrations')
    .select('id, user_id, event_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  const rows = (data ?? []) as {
    id: string
    user_id: string | null
    event_id: string | null
    status: RegistrationStatus | null
    created_at: string | null
  }[]

  const userIds = rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))
  let names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, display_name, full_name')
      .in('id', userIds)
    if (profileError) throw profileError
    const profileRows = (profiles ?? []) as { id: string; display_name: string | null; full_name: string | null }[]
    names = Object.fromEntries(profileRows.map((p) => [p.id, p.display_name || p.full_name || '']))
  }

  const eventIds = rows.map((r) => r.event_id).filter((id): id is string => Boolean(id))
  let titles: Record<string, string> = {}
  if (eventIds.length > 0) {
    const { data: events, error: eventsError } = await admin
      .from('events')
      .select('id, title_en')
      .in('id', eventIds)
    if (eventsError) throw eventsError
    const eventRows = (events ?? []) as { id: string; title_en: string }[]
    titles = Object.fromEntries(eventRows.map((e) => [e.id, e.title_en]))
  }

  return rows.map((row) => ({
    id: row.id,
    participant_name: row.user_id ? names[row.user_id] || '—' : '—',
    event_id: row.event_id,
    event_title: row.event_id ? titles[row.event_id] ?? null : null,
    status: row.status,
    created_at: row.created_at
  }))
}

export async function getRegistrationsPerEvent(): Promise<RegistrationsPerEvent[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('registrations')
    .select('event_id, events(title_en)')
  if (error) throw error
  const counts = new Map<string, RegistrationsPerEvent>()
  for (const row of (data ?? []) as {
    event_id: string | null
    events: { title_en: string } | { title_en: string }[] | null
  }[]) {
    if (!row.event_id) continue
    const existing = counts.get(row.event_id)
    if (existing) {
      existing.count += 1
    } else {
      const event = Array.isArray(row.events) ? row.events[0] : row.events
      counts.set(row.event_id, { event_id: row.event_id, event_title: event?.title_en ?? null, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)
}