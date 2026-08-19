// Centralized same-origin / CSRF protection for state-changing requests.
//
// Design decisions:
// - All legitimate same-origin browser mutations (fetch/form POST, PUT, DELETE)
//   include an Origin header, so a missing Origin header on a state-changing
//   request is rejected with 403. This covers non-browser clients (curl,
//   scripts) which are outside the CSRF threat model.
// - When present, Origin is never trusted on its own: it is parsed and its
//   hostname is compared against the request Host header. Any mismatch is
//   rejected with 403. Client-supplied origins that merely claim to be us are
//   therefore rejected.
// - Host header comparison uses the hostname only (port-agnostic) so the check
//   remains correct behind proxies that normalize ports.
// - This helper is the single place where CSRF/same-origin checks live. A token
//   based double-submit check can be added here later without touching routes.

export type CsrfResult = { ok: true } | { ok: false; status: 403; error: string }

export function verifyCsrfRequest(request: Request): CsrfResult {
  const origin = request.headers.get('origin')
  if (!origin) {
    return { ok: false, status: 403, error: 'Missing Origin header.' }
  }

  let originHostname: string
  try {
    originHostname = new URL(origin).hostname.toLowerCase()
  } catch {
    return { ok: false, status: 403, error: 'Invalid Origin header.' }
  }

  const hostHeader = request.headers.get('host')
  let hostHostname: string
  try {
    hostHostname = new URL(`http://${hostHeader ?? ''}`).hostname.toLowerCase()
  } catch {
    return { ok: false, status: 403, error: 'Invalid Host header.' }
  }

  if (!originHostname || originHostname !== hostHostname) {
    return { ok: false, status: 403, error: 'Cross-origin request rejected.' }
  }

  return { ok: true }
}