// Open-redirect protection for client-side redirect targets.
//
// Accepts only root-relative internal paths (e.g. `/account`,
// `/events/register/foo`). Rejects absolute URLs (`https://evil.com`),
// protocol-relative URLs (`//evil.com`), backslash tricks (`/\evil.com`,
// `https:\\evil.com`), encoded variants (`/%2F%2Fevil.com`,
// `/https:%2F%2Fevil.com`), scheme prefixes (`javascript:`, `data:`, ...),
// control characters, and values that are empty or overly long.

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i
const PROTOCOL_RELATIVE_RE = /^\/{2,}/

const MAX_LENGTH = 2048

function isUnsafeForm(value: string): boolean {
  if (SCHEME_RE.test(value)) return true
  if (value.includes('\\')) return true
  if (value.includes('://')) return true
  if (PROTOCOL_RELATIVE_RE.test(value)) return true
  if (CONTROL_CHARS.test(value)) return true
  return false
}

export function isSafeInternalPath(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false
  if (value.length === 0 || value.length > MAX_LENGTH) return false

  // Must be a single root-relative path.
  if (value[0] !== '/') return false
  if (isUnsafeForm(value)) return false

  // Defeat encoding tricks by inspecting progressively decoded forms.
  let probe = value
  for (let i = 0; i < 3; i++) {
    if (isUnsafeForm(probe)) return false
    let next: string
    try {
      next = decodeURIComponent(probe)
    } catch {
      break
    }
    if (next === probe) break
    probe = next
  }

  return true
}