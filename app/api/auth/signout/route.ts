import { NextResponse } from 'next/server'
import createServerClient from '../../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect('/')
}
