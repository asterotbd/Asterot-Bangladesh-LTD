import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient<any> | null = null

export function getAdminSupabase(): SupabaseClient<any> {
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

let authAdminClient: SupabaseClient<any, 'auth', 'auth'> | null = null

// Server-only client scoped to the auth schema (service role). Used to read
// non-secret auth metadata such as email/confirmation state for admin user
// management. Never exposes tokens, password hashes, or MFA secrets.
export function getAuthAdminSupabase(): SupabaseClient<any, 'auth', 'auth'> {
  if (authAdminClient) return authAdminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error('Missing Supabase admin credentials in server environment')
  }
  authAdminClient = createClient(url, serviceRole, {
    auth: { persistSession: false },
    db: { schema: 'auth' }
  })
  return authAdminClient
}
