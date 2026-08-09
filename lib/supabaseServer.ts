import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'

export function createServerClient(ctx?: { headers?: Headers, cookies?: any }){
  // In server components, rely on Next's headers/cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return createServerComponentSupabaseClient({
    supabaseUrl,
    supabaseKey,
    headers: ctx?.headers ? () => ctx!.headers! : () => headers(),
    cookies: ctx?.cookies ? () => ctx!.cookies! : () => cookies(),
  })
}

export default createServerClient
