import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerComponentSupabaseClient({ headers: () => headers(), cookies: () => cookies() })
  await supabase.auth.signOut()
  return NextResponse.redirect('/')
}
