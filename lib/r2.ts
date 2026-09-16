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

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. R2 media operations cannot proceed.`)
  }
  return value
}

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

export function getR2Config(): R2Config {
  const endpoint = requireEnv('R2_S3_ENDPOINT')
  const bucket = requireEnv('R2_BUCKET')
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY')
  const publicUrl = requireEnv('NEXT_PUBLIC_R2_PUBLIC_URL').replace(/\/+$/, '')
  return { endpoint: endpoint.replace(/\/+$/, ''), bucket, accessKeyId, secretAccessKey, publicUrl }
}

/** True when R2 is fully configured and should receive new uploads. */
export function isR2Enabled(): boolean {
  try {
    getR2Config()
    return true
  } catch {
    return false
  }
}

const sha256Hex = (data: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(data).digest('hex')
const hmac = (key: crypto.BinaryLike | crypto.KeyObject, data: string) =>
  crypto.createHmac('sha256', key as crypto.BinaryLike).update(data).digest()

function signingKey(secret: string, datestamp: string) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, datestamp), REGION), SERVICE), 'aws4_request')
}

const encodeKey = (key: string) => key.split('/').map(encodeURIComponent).join('/')

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

  const { url, headers } = signed(cfg, 'PUT', key, body, {
    'content-type': contentType,
    // Keys embed a timestamp and are never rewritten in place, so a long
    // immutable cache is safe and keeps R2 class-B operations down.
    'cache-control': 'public, max-age=31536000, immutable'
  })

  const res = await fetch(url, { method: 'PUT', body, headers })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 upload failed (${res.status}): ${detail.slice(0, 300)}`)
  }
  return { key, publicUrl: `${cfg.publicUrl}/${encodeKey(key)}` }
}

/** Best-effort delete; a failure is logged rather than thrown. */
export async function deleteObject(key: string): Promise<void> {
  const cfg = getR2Config()
  try {
    const { url, headers } = signed(cfg, 'DELETE', key, '')
    const res = await fetch(url, { method: 'DELETE', headers })
    // R2 returns 204 for a successful delete and 404 when already gone.
    if (!res.ok && res.status !== 404) {
      logError('r2.delete', new Error(`${res.status} ${res.statusText}`))
    }
  } catch (err) {
    logError('r2.delete', err)
  }
}
