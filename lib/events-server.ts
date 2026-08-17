import getAdminSupabase from './supabaseAdmin'

export type DbEvent = {
  id: string
  title_en: string
  title_bn: string | null
  slug: string
  description_en: string | null
  description_bn: string | null
  category_id: string | null
  date: string | null
  time: string | null
  location: string | null
  registration_deadline: string | null
  capacity: number | null
  published: boolean
  created_at: string | null
  updated_at: string | null
}

export type EventCategory = {
  id: string
  name_en: string | null
  slug: string | null
}

export const EVENT_ADMIN_ROLES: string[] = ['super_admin', 'admin']

const EVENT_FIELDS = 'id, title_en, title_bn, slug, description_en, description_bn, category_id, date, time, location, registration_deadline, capacity, published, created_at, updated_at'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function isUpcoming(event: Pick<DbEvent, 'date'>): boolean {
  if (!event.date) return true
  return event.date >= todayISO()
}

export function formatEventDate(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function getPublishedEvents(): Promise<DbEvent[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('events')
    .select(EVENT_FIELDS)
    .eq('published', true)
    .order('date', { ascending: false, nullsFirst: true })
  if (error) {
    console.error('getPublishedEvents error', error.message)
    return []
  }
  return (data ?? []) as DbEvent[]
}

export async function getPublishedEventBySlug(slug: string): Promise<DbEvent | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('events')
    .select(EVENT_FIELDS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) {
    console.error('getPublishedEventBySlug error', error.message)
    return null
  }
  return (data as DbEvent | null) ?? null
}

export async function getAllEvents(): Promise<DbEvent[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('events')
    .select(EVENT_FIELDS)
    .order('date', { ascending: false, nullsFirst: true })
  if (error) {
    console.error('getAllEvents error', error.message)
    return []
  }
  return (data ?? []) as DbEvent[]
}

export async function getEventById(id: string): Promise<DbEvent | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('events')
    .select(EVENT_FIELDS)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('getEventById error', error.message)
    return null
  }
  return (data as DbEvent | null) ?? null
}

export async function getEventCategories(): Promise<EventCategory[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('categories')
    .select('id, name_en, slug')
    .order('name_en', { ascending: true })
  if (error) {
    console.error('getEventCategories error', error.message)
    return []
  }
  return (data ?? []) as EventCategory[]
}
