import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import createServerClient from '../../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  cookies().set('supabase-auth-token', '', { path: '/', maxAge: 0, sameSite: 'lax' })
  const url = new URL('/', request.url)
  return NextResponse.redirect(url)
}
