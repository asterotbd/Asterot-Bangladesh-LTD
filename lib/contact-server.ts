import getAdminSupabase from './supabaseAdmin'

export const CONTACT_STATUSES = ['new', 'read', 'handled', 'archived'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export type DbContactMessage = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  organization: string | null
  subject: string | null
  message: string | null
  status: string | null
  created_at: string | null
}

export type ContactListResult = {
  messages: DbContactMessage[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export async function listContactMessages({
  page = 1,
  perPage = 20,
  search = '',
  status = ''
}: {
  page?: number
  perPage?: number
  search?: string
  status?: string
}): Promise<ContactListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let query = admin
    .from('contact_messages')
    .select('id, name, email, phone, organization, subject, message, status, created_at', { count: 'exact' })

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,subject.ilike.%${escaped}%`)
  }
  if (status && CONTACT_STATUSES.includes(status as ContactStatus)) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const total = count ?? 0
  return {
    messages: (data ?? []) as DbContactMessage[],
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

export async function getContactMessage(id: string): Promise<DbContactMessage | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('contact_messages')
    .select('id, name, email, phone, organization, subject, message, status, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as DbContactMessage | null) ?? null
}

export async function updateContactMessageStatus(id: string, status: ContactStatus): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('contact_messages') as any)
    .update({ status })
    .eq('id', id)
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}
