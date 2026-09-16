// Server-side Cloudflare R2 client (S3-compatible API).
//
// Dependency-free on purpose: @aws-sdk/client-s3 would add a large subtree to
// the serverless bundle for what amounts to two signed HTTP calls. R2 ignores
// the region but still requires it in the credential scope, where it must be
// the literal "auto".
//
// This module reads secrets and must never be imported from a client
// component. `asset()` in lib/assets.ts is the browser-safe counterpart.

import crypto from 'node:crypto'
import { logError } from './api-utils'

const ALGORITHM = 'AWS4-HMAC-SHA256'
const REGION = 'auto'
const SERVICE = 's3'

// Objects uploaded through the admin UI live under this prefix. Legacy
// Supabase Storage objects use "admin/", which is how deleteStorageFile tells
// the two backends apart without a schema change.
export const R2_UPLOAD_PREFIX = 'uploads'

type R2Config = {
  endpoint: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string
}

export function getR2Config(): R2Config | null {
  const endpoint = process.env.R2_S3_ENDPOINT
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const publicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '')
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) return null
  return { endpoint: endpoint.replace(/\/+$/, ''), bucket, accessKeyId, secretAccessKey, publicUrl }
}

/** True when R2 is fully configured and should receive new uploads. */
export function isR2Enabled(): boolean {
  return getR2Config() !== null
}

const sha256Hex = (data: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(data).digest('hex')
const hmac = (key: crypto.BinaryLike | crypto.KeyObject, data: string) =>
  crypto.createHmac('sha256', key as crypto.BinaryLike).update(data).digest()

function signingKey(secret: string, datestamp: string) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, datestamp), REGION), SERVICE), 'aws4_request')
}

const encodeKey = (key: string) => key.split('/').map(encodeURIComponent).join('/')

// SigV4 wants strict RFC 3986 encoding, which encodeURIComponent stops short of.
const encodeRfc3986 = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

// Sent on every upload. Keys embed a timestamp and are never rewritten in
// place, so a long immutable cache is safe and keeps R2 read operations down.
export const UPLOAD_CACHE_CONTROL = 'public, max-age=31536000, immutable'

// Every call to R2 is a live read or write against the bucket. Next.js patches
// fetch with its Data Cache, and a cached HEAD would report an object as
// missing (or present) long after that stopped being true.
const NO_STORE = { cache: 'no-store' } as const

function signed(
  cfg: R2Config,
  method: string,
  key: string,
  body: Buffer | string,
  extraHeaders: Record<string, string> = {}
) {
  const url = new URL(`${cfg.endpoint}/${cfg.bucket}/${encodeKey(key)}`)
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const datestamp = amzDate.slice(0, 8)
  const payloadHash = sha256Hex(body)

  const headers: Record<string, string> = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...Object.fromEntries(Object.entries(extraHeaders).map(([k, v]) => [k.toLowerCase(), v]))
  }

  // SigV4 requires signed headers sorted by lowercased name.
  const names = Object.keys(headers).sort()
  const canonicalRequest = [
    method,
    url.pathname,
    '',
    names.map((n) => `${n}:${headers[n].trim()}\n`).join(''),
    names.join(';'),
    payloadHash
  ].join('\n')

  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`
  const signature = crypto
    .createHmac('sha256', signingKey(cfg.secretAccessKey, datestamp))
    .update([ALGORITHM, amzDate, scope, sha256Hex(canonicalRequest)].join('\n'))
    .digest('hex')

  return {
    url: url.toString(),
    headers: {
      ...headers,
      Authorization: `${ALGORITHM} Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`
    }
  }
}

/** Uploads a buffer and returns its public URL. Throws if R2 rejects the write. */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<{ key: string; publicUrl: string }> {
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 is not configured')

  const { url, headers } = signed(cfg, 'PUT', key, body, {
    'content-type': contentType,
    'cache-control': UPLOAD_CACHE_CONTROL
  })

  const res = await fetch(url, { method: 'PUT', body, headers, ...NO_STORE })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 upload failed (${res.status}): ${detail.slice(0, 300)}`)
  }
  return { key, publicUrl: `${cfg.publicUrl}/${encodeKey(key)}` }
}

/** Best-effort delete; a failure is logged rather than thrown. */
export async function deleteObject(key: string): Promise<void> {
  const cfg = getR2Config()
  if (!cfg) return
  try {
    const { url, headers } = signed(cfg, 'DELETE', key, '')
    const res = await fetch(url, { method: 'DELETE', headers, ...NO_STORE })
    // R2 returns 204 for a successful delete and 404 when already gone.
    if (!res.ok && res.status !== 404) {
      logError('r2.delete', new Error(`${res.status} ${res.statusText}`))
    }
  } catch (err) {
    logError('r2.delete', err)
  }
}

/** Public URL an object key is served from. */
export function publicUrlFor(key: string): string {
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 is not configured')
  return `${cfg.publicUrl}/${encodeKey(key)}`
}

/**
 * Signs a short-lived URL that lets the browser PUT one object straight to R2.
 *
 * Uploading directly keeps the file out of the Vercel function, whose request
 * body is capped at 4.5 MB. The signature covers the exact key, content type
 * and cache-control, so the URL cannot be reused to write anything else; the
 * browser must send those two headers verbatim. A presigned PUT cannot bound
 * the body size, which is why the completion step re-checks it on the stored
 * object before a media row is created.
 */
export function presignPut(
  key: string,
  contentType: string,
  expiresIn = 600
): { url: string; headers: Record<string, string> } {
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 is not configured')

  const url = new URL(`${cfg.endpoint}/${cfg.bucket}/${encodeKey(key)}`)
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const datestamp = amzDate.slice(0, 8)
  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`

  const signedHeaders: Record<string, string> = {
    'cache-control': UPLOAD_CACHE_CONTROL,
    'content-type': contentType,
    host: url.host
  }
  const names = Object.keys(signedHeaders).sort()

  const query: Record<string, string> = {
    'X-Amz-Algorithm': ALGORITHM,
    'X-Amz-Credential': `${cfg.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': names.join(';')
  }
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k])}`)
    .join('&')

  const canonicalRequest = [
    'PUT',
    url.pathname,
    canonicalQuery,
    names.map((n) => `${n}:${signedHeaders[n]}\n`).join(''),
    names.join(';'),
    'UNSIGNED-PAYLOAD'
  ].join('\n')

  const signature = crypto
    .createHmac('sha256', signingKey(cfg.secretAccessKey, datestamp))
    .update([ALGORITHM, amzDate, scope, sha256Hex(canonicalRequest)].join('\n'))
    .digest('hex')

  url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`
  return {
    url: url.toString(),
    headers: { 'Content-Type': contentType, 'Cache-Control': UPLOAD_CACHE_CONTROL }
  }
}

/** Size and type of a stored object, or null when it does not exist. */
export async function headObject(key: string): Promise<{ size: number; contentType: string | null } | null> {
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 is not configured')
  const { url, headers } = signed(cfg, 'HEAD', key, '')
  const res = await fetch(url, { method: 'HEAD', headers, ...NO_STORE })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 HEAD failed (${res.status})`)
  return {
    size: Number(res.headers.get('content-length') ?? 0),
    contentType: res.headers.get('content-type')
  }
}

/**
 * Reads only the first `length` bytes of an object. Enough to sniff an image's
 * magic bytes without downloading a multi-megabyte upload into the function.
 */
export async function readObjectPrefix(key: string, length = 64): Promise<Buffer | null> {
  const cfg = getR2Config()
  if (!cfg) throw new Error('R2 is not configured')
  const range = `bytes=0-${length - 1}`
  const { url, headers } = signed(cfg, 'GET', key, '', { range })
  const res = await fetch(url, { headers, ...NO_STORE })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 GET failed (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}
