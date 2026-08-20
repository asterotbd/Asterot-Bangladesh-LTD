import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export type DbHomepageSection = {
  id: string
  section_key: string
  heading: string | null
  subtitle: string | null
  body: string | null
  cta_text: string | null
  cta_url: string | null
  image_media_id: string | null
  visible: boolean | null
  display_order: number | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export const HOMEPAGE_SECTION_KEYS = ['hero', 'capabilities', 'featured_event', 'companies'] as const
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number]

export const HOMEPAGE_SECTION_FIELDS =
  'id, section_key, heading, subtitle, body, cta_text, cta_url, image_media_id, visible, display_order, created_by, created_at, updated_at'

export async function listHomepageSections(): Promise<DbHomepageSection[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('homepage_sections').select(HOMEPAGE_SECTION_FIELDS).order('display_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as DbHomepageSection[]
}

export async function getHomepageSection(key: string): Promise<DbHomepageSection | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('homepage_sections').select(HOMEPAGE_SECTION_FIELDS).eq('section_key', key).maybeSingle()
  if (error) throw error
  return (data as DbHomepageSection | null) ?? null
}

export async function upsertHomepageSection(
  key: string,
  fields: {
    heading?: string | null
    subtitle?: string | null
    body?: string | null
    cta_text?: string | null
    cta_url?: string | null
    image_media_id?: string | null
    visible?: boolean
    display_order?: number
  }
): Promise<boolean> {
  const admin = getAdminSupabase()
  const payload: Record<string, unknown> = {
    section_key: key,
    ...fields,
    updated_at: new Date().toISOString()
  }
  const { data, error } = await (admin.from('homepage_sections') as any)
    .upsert(payload, { onConflict: 'section_key' })
    .select('id')
  if (error) {
    logError('homepage.upsert', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function getPublicHomepageSections(): Promise<DbHomepageSection[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('homepage_sections')
    .select(HOMEPAGE_SECTION_FIELDS)
    .eq('visible', true)
    .order('display_order', { ascending: true })
  if (error) {
    logError('homepage.public-sections', error)
    return []
  }
  return (data ?? []) as DbHomepageSection[]
}