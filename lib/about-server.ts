import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export type DbCompanyInfo = {
  id: string
  name_en: string | null
  name_bn: string | null
  founded_date: string | null
  location: string | null
  tagline_en: string | null
  tagline_bn: string | null
  slogan_en: string | null
  slogan_bn: string | null
  short_description_en: string | null
  short_description_bn: string | null
  long_description_en: string | null
  long_description_bn: string | null
  about_en: string | null
  about_bn: string | null
  story_en: string | null
  story_bn: string | null
  what_we_do_en: string | null
  what_we_do_bn: string | null
  approach_en: string | null
  approach_bn: string | null
  seo_title: string | null
  seo_description: string | null
  featured_media_id: string | null
  published: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type DbLeader = {
  id: string
  name: string
  position: string | null
  photo_media_id: string | null
  short_bio_en: string | null
  short_bio_bn: string | null
  full_bio_en: string | null
  full_bio_bn: string | null
  display_order: number | null
  published: boolean | null
  created_at: string | null
  updated_at: string | null
}

const COMPANY_INFO_FIELDS =
  'id, name_en, name_bn, founded_date, location, tagline_en, tagline_bn, slogan_en, slogan_bn, short_description_en, short_description_bn, long_description_en, long_description_bn, about_en, about_bn, story_en, story_bn, what_we_do_en, what_we_do_bn, approach_en, approach_bn, seo_title, seo_description, featured_media_id, published, created_at, updated_at'

const LEADERSHIP_FIELDS =
  'id, name, position, photo_media_id, short_bio_en, short_bio_bn, full_bio_en, full_bio_bn, display_order, published, created_at, updated_at'

export async function getCompanyInfo(): Promise<DbCompanyInfo | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('company_info').select(COMPANY_INFO_FIELDS).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) {
    logError('about.company-info', error)
    return null
  }
  return (data as DbCompanyInfo | null) ?? null
}

export async function getPublicCompanyInfo(): Promise<DbCompanyInfo | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('company_info')
    .select(COMPANY_INFO_FIELDS)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    logError('about.public-company-info', error)
    return null
  }
  return (data as DbCompanyInfo | null) ?? null
}

export async function updateCompanyInfo(id: string, fields: Partial<DbCompanyInfo>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('company_info') as any)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
  if (error) {
    logError('about.company-info-update', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function listLeadership(): Promise<DbLeader[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('leadership').select(LEADERSHIP_FIELDS).order('display_order', { ascending: true })
  if (error) {
    logError('about.leadership-list', error)
    return []
  }
  return (data ?? []) as DbLeader[]
}

export async function getPublicLeadership(): Promise<DbLeader[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('leadership').select(LEADERSHIP_FIELDS).eq('published', true).order('display_order', { ascending: true })
  if (error) {
    logError('about.public-leadership', error)
    return []
  }
  return (data ?? []) as DbLeader[]
}

export async function createLeader(record: Partial<DbLeader>): Promise<DbLeader | null> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('leadership') as any).insert(record).select(LEADERSHIP_FIELDS).single()
  if (error) {
    logError('about.leadership-create', error)
    throw error
  }
  return (data as DbLeader) ?? null
}

export async function updateLeader(id: string, fields: Partial<DbLeader>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('leadership') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) {
    logError('about.leadership-update', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function deleteLeader(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { error } = await (admin.from('leadership') as any).delete().eq('id', id)
  if (error) {
    logError('about.leadership-delete', error)
    throw error
  }
  return true
}