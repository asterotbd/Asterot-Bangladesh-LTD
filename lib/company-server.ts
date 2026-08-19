import getAdminSupabase from './supabaseAdmin'

export type CompanySnapshot = {
  name: string | null
  founded_year: number | null
  tagline: string | null
}

export async function getCompanySnapshot(): Promise<CompanySnapshot | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('company_info')
    .select('name_en, founded_date, tagline_en')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  const row = data as { name_en: string | null; founded_date: string | null; tagline_en: string | null } | null
  if (!row) return null
  const year = Number(String(row.founded_date ?? '').slice(0, 4))
  return {
    name: row.name_en ?? null,
    founded_year: row.founded_date && Number.isFinite(year) ? year : null,
    tagline: row.tagline_en ?? null
  }
}