import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import createServerClient from '../../../../lib/supabaseServer'
import { jsonError, logError } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  const supabase = createServerClient()
  try {
    await supabase.auth.signOut()
  } catch (err) {
    // Sign-out still proceeds: cookie cleanup below guarantees the local
    // session is cleared even if the remote revoke call fails.
    logError('auth.signout', err)
  }

  // Best-effort cleanup. The SDK clears the current sb-<ref>-auth-token cookies
  // via Set-Cookie; these fallback clears cover edge cases (e.g. a failed
  // network revoke) and any legacy supabase-auth-token cookie from before the
  // @supabase/ssr migration.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const ref = new URL(supabaseUrl).hostname.split('.')[0]
      const base = `sb-${ref}-auth-token`
      cookies().set(base, '', { path: '/', maxAge: 0, sameSite: 'lax' })
      for (let i = 0; i < 10; i++) {
        cookies().set(`${base}.${i}`, '', { path: '/', maxAge: 0, sameSite: 'lax' })
      }
    } catch {
      // Invalid URL or unset cookie context — nothing more to clean up.
    }
  }
  cookies().set('supabase-auth-token', '', { path: '/', maxAge: 0, sameSite: 'lax' })

  return NextResponse.json({ ok: true })
}