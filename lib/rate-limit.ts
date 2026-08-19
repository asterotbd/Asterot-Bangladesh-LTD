import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

// DB-backed rate limiting for sensitive mutations.
//
// The limiter lives in the shared Postgres database (migration
// 016_rate_limiting.sql) so every serverless instance observes the same
// counters. Each call atomically records one attempt and reports whether the
// attempt is still within budget.
//
// Security:
//   - The underlying RPC (rate_limit_consume) is granted EXECUTE to
//     service_role only, so browser clients / the user-scoped client cannot
//     consume or reset budget through direct Supabase access.
//   - Keys are derived from the authenticated actor's user id server-side.
//
// Limitations (documented):
//   - Best-effort application guard; not a substitute for edge WAF rules.
//   - Fails OPEN: if the database is unreachable the attempt is allowed and the
//     error is logged, so a transient DB outage never locks everyone out.
//   - Login attempts are not counted here because sign-in goes directly from
//     the browser to Supabase Auth, which applies its own built-in rate limits.

export const RATE_LIMIT_WINDOW_SECONDS = 600

export const RATE_LIMIT_RULES = {
  roleAssign: { prefix: 'role-assign', max: 20 },
  roleRemove: { prefix: 'role-remove', max: 20 },
  userProfileMutate: { prefix: 'user-profile', max: 60 },
  eventsMutate: { prefix: 'events', max: 60 },
  newsMutate: { prefix: 'news', max: 60 },
  companyMutate: { prefix: 'company', max: 60 },
  eventRegistration: { prefix: 'registration', max: 10 }
} as const

export function makeRateLimitKey(prefix: string, actorId: string): string {
  return `${prefix}:${actorId}`
}

/**
 * Record one attempt and report whether the actor is over budget.
 * Returns true when the request should be rejected (429).
 * Never throws: any failure is logged and treated as "not limited".
 */
export async function isRateLimited(prefix: string, actorId: string, windowSeconds = RATE_LIMIT_WINDOW_SECONDS, max = 30): Promise<boolean> {
  try {
    const admin = getAdminSupabase()
    const { data, error } = await admin.rpc('rate_limit_consume', {
      p_key: makeRateLimitKey(prefix, actorId),
      p_window_seconds: windowSeconds,
      p_max: max
    })
    if (error) {
      logError('rate-limit.rpc', error)
      return false
    }
    // RPC returns true when the attempt is within budget, false when over it.
    return data === false
  } catch (err) {
    logError('rate-limit', err)
    return false
  }
}