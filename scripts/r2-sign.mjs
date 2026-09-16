// Minimal AWS SigV4 request signer for Cloudflare R2's S3-compatible API.
//
// Deliberately dependency-free: the only consumer is a one-time media upload,
// and @aws-sdk/client-s3 would pull ~20 packages into the tree for it. R2
// ignores the region but still requires it in the credential scope, where it
// must be the literal "auto".

import crypto from 'node:crypto'

const ALGORITHM = 'AWS4-HMAC-SHA256'
const REGION = 'auto'
const SERVICE = 's3'

const sha256Hex = (data) => crypto.createHash('sha256').update(data).digest('hex')
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest()

function signingKey(secret, datestamp) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, datestamp), REGION), SERVICE), 'aws4_request')
}

// SigV4 wants strict RFC 3986 encoding, which encodeURIComponent stops short of.
const encodeRfc3986 = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

// Each path segment is encoded, but "/" separators are preserved.
function encodeKey(key) {
  return key.split('/').map(encodeURIComponent).join('/')
}

/**
 * Builds the headers for a signed, path-style R2 request.
 *
 * @param {object} o
 * @param {string} o.method       HTTP verb, e.g. 'PUT' or 'HEAD'
 * @param {string} o.endpoint     https://<account>.r2.cloudflarestorage.com
 * @param {string} o.bucket
 * @param {string} o.key          object key, no leading slash; '' for a bucket-level call
 * @param {Buffer|string} [o.body]
 * @param {Record<string,string>} [o.headers] extra headers to sign
 * @param {Record<string,string>} [o.query] query parameters, e.g. { cors: '' }
 * @param {string} o.accessKeyId
 * @param {string} o.secretAccessKey
 */
export function signRequest({
  method, endpoint, bucket, key, body = '', headers = {}, query = {}, accessKeyId, secretAccessKey
}) {
  const base = endpoint.replace(/\/+$/, '')
  const url = new URL(key ? `${base}/${bucket}/${encodeKey(key)}` : `${base}/${bucket}`)
  const canonicalQuery = Object.keys(query).sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k])}`)
    .join('&')
  if (canonicalQuery) url.search = canonicalQuery
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const datestamp = amzDate.slice(0, 8)
  const payloadHash = sha256Hex(body)

  const signed = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]))
  }

  // SigV4 requires signed headers sorted by lowercased name.
  const names = Object.keys(signed).sort()
  const canonicalHeaders = names.map((n) => `${n}:${signed[n].trim()}\n`).join('')
  const signedHeaders = names.join(';')

  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [ALGORITHM, amzDate, scope, sha256Hex(canonicalRequest)].join('\n')
  const signature = crypto
    .createHmac('sha256', signingKey(secretAccessKey, datestamp))
    .update(stringToSign)
    .digest('hex')

  return {
    url: url.toString(),
    headers: {
      ...signed,
      Authorization: `${ALGORITHM} Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    }
  }
}
