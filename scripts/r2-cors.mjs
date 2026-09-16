// Shows or applies the R2 bucket CORS policy that browser uploads depend on.
//
//   node scripts/r2-cors.mjs                         # print the current policy
//   node scripts/r2-cors.mjs --apply                 # apply the default origins
//   node scripts/r2-cors.mjs --apply --origin https://preview.example.com
//
// The admin uploads files straight from the browser to R2 using a presigned
// PUT URL, so the upload never passes through a Vercel function and is not
// subject to its 4.5 MB request-body limit. Browsers only allow that
// cross-origin PUT when the bucket's CORS policy names the site's origin.
//
// Allowing an origin here does not grant write access by itself: every PUT
// still needs a short-lived URL signed by /api/admin/uploads/presign, which
// requires an authenticated admin with media.manage.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { signRequest } from './r2-sign.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const DEFAULT_ORIGINS = ['http://localhost:3000', 'https://www.asterot.com', 'https://asterot.com']
const extra = process.argv.flatMap((a, i, all) => (a === '--origin' && all[i + 1] ? [all[i + 1]] : []))
const origins = [...new Set([...DEFAULT_ORIGINS, ...extra])]

const cfg = {
  endpoint: process.env.R2_S3_ENDPOINT,
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
}
for (const [k, v] of Object.entries(cfg)) {
  if (!v) { console.error(`Missing ${k} in .env.local`); process.exit(1) }
}

async function show() {
  const { url, headers } = signRequest({ method: 'GET', key: '', query: { cors: '' }, ...cfg })
  const res = await fetch(url, { headers })
  const body = await res.text()
  if (res.status === 404 || /NoSuchCORSConfiguration/.test(body)) return console.log('No CORS policy is set on this bucket.')
  if (!res.ok) return console.log(`GET cors -> ${res.status}\n${body.slice(0, 400)}`)
  console.log(body)
}

async function apply() {
  // Only PUT is needed: public reads go through the r2.dev / custom domain,
  // not the S3 endpoint. Both headers the upload sends must be allowed.
  const xml =
    '<CORSConfiguration><CORSRule>' +
    origins.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join('') +
    '<AllowedMethod>PUT</AllowedMethod>' +
    '<AllowedHeader>content-type</AllowedHeader>' +
    '<AllowedHeader>cache-control</AllowedHeader>' +
    '<MaxAgeSeconds>3600</MaxAgeSeconds>' +
    '</CORSRule></CORSConfiguration>'

  const { url, headers } = signRequest({
    method: 'PUT',
    key: '',
    query: { cors: '' },
    body: xml,
    headers: {
      'content-type': 'application/xml',
      // S3's PutBucketCors requires an MD5 of the body.
      'content-md5': crypto.createHash('md5').update(xml).digest('base64')
    },
    ...cfg
  })
  const res = await fetch(url, { method: 'PUT', body: xml, headers })
  if (!res.ok) {
    const detail = await res.text()
    console.error(`PUT cors -> ${res.status}\n${detail.slice(0, 400)}`)
    if (res.status === 403) {
      console.error('\nThe R2 token cannot change bucket settings. Set the policy in the dashboard instead:')
      console.error(`R2 -> ${cfg.bucket} -> Settings -> CORS Policy -> Add:`)
      console.error(JSON.stringify([{ AllowedOrigins: origins, AllowedMethods: ['PUT'], AllowedHeaders: ['content-type', 'cache-control'], MaxAgeSeconds: 3600 }], null, 2))
    }
    process.exit(1)
  }
  console.log(`Applied CORS policy for: ${origins.join(', ')}`)
}

if (process.argv.includes('--apply')) await apply()
await show()
