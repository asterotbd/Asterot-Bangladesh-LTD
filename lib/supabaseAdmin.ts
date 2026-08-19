import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient<any> | null = null

export function getAdminSupabase() {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error('Missing Supabase admin credentials in server environment')
  }
  adminClient = createClient(url, serviceRole, {
    auth: { persistSession: false }
  })
  return adminClient
}

export default getAdminSupabase
