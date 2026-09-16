// One-time upload of local public/ media into the Cloudflare R2 bucket.
//
//   node scripts/upload-to-r2.mjs            # upload anything missing
//   node scripts/upload-to-r2.mjs --dry-run  # list what would be sent
//   node scripts/upload-to-r2.mjs --force    # re-upload even if present
//   node scripts/upload-to-r2.mjs --verify   # only check what is already there
//
// Object keys mirror the path under public/, so public/media/photos/x.jpg
// becomes key media/photos/x.jpg and is served from
// $NEXT_PUBLIC_R2_PUBLIC_URL/media/photos/x.jpg. Keeping that 1:1 mapping is
// what lets the URL rewrite be a simple prefix swap, and makes a rollback to
// local files equally simple.

import fs from 'node:fs'
import path from 'node:path'
import { signRequest } from './r2-sign.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const VERIFY_ONLY = process.argv.includes('--verify')
const CONCURRENCY = Number(process.env.R2_CONCURRENCY || 4)
const MAX_ATTEMPTS = 5

// Directories under public/ whose contents move to R2. favicon.png stays local
// so the tab icon never depends on an external host.
const SOURCE_DIRS = ['media', 'images', 'brand']

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.bmp': 'image/bmp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.pdf': 'application/pdf'
}

function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const cfg = {
  endpoint: process.env.R2_S3_ENDPOINT,
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  publicUrl: (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '')
}

const missing = Object.entries(cfg)
  .filter(([k, v]) => !v && !(k === 'publicUrl' && VERIFY_ONLY === false))
  .map(([k]) => k)
if (!cfg.endpoint || !cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
  console.error('Missing R2 configuration in .env.local:')
  for (const k of ['R2_S3_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) {
    if (!process.env[k]) console.error(`  - ${k}`)
  }
  console.error('\nCreate a token at Cloudflare -> R2 -> Manage R2 API Tokens (Object Read & Write).')
  process.exit(1)
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.isFile() && !entry.name.startsWith('.')) acc.push(full)
  }
  return acc
}

const files = SOURCE_DIRS
  .flatMap((d) => walk(path.join(ROOT, 'public', d)))
  .map((abs) => ({
    abs,
    key: path.relative(path.join(ROOT, 'public'), abs).split(path.sep).join('/'),
    size: fs.statSync(abs).size
  }))
  .sort((a, b) => a.key.localeCompare(b.key))

if (files.length === 0) {
  console.error('No files found under public/{media,images,brand}.')
  process.exit(1)
}

const totalBytes = files.reduce((n, f) => n + f.size, 0)
const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(`${files.length} files, ${mb(totalBytes)} MB`)
console.log(`bucket: ${cfg.bucket}`)
console.log(`public base: ${cfg.publicUrl || '(not set — URL rewrite will be skipped)'}\n`)

// Cloudflare compresses text-ish types (SVG, plain text) in transit and then
// omits content-length, so a missing header means "present, size not
// comparable" rather than a zero-byte object. Treating it as 0 made every
// SVG look like a mismatch and re-upload on each run.
async function head(file) {
  const { url, headers } = signRequest({ method: 'HEAD', key: file.key, ...cfg })
  const res = await fetch(url, { method: 'HEAD', headers })
  if (res.status !== 200) return { exists: false, size: null }
  const raw = res.headers.get('content-length')
  const encoded = (res.headers.get('content-encoding') || '') !== ''
  return { exists: true, size: raw !== null && !encoded ? Number(raw) : null }
}

// size === null means the remote size could not be compared; presence is all
// we can assert for those objects.
const sizeMatches = (remote, local) => remote.size === null || remote.size === local

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function put(file) {
  const body = fs.readFileSync(file.abs)
  const ext = path.extname(file.abs).toLowerCase()

  let lastError
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Re-sign on every attempt: the SigV4 x-amz-date is part of the signature
    // and a stale one is rejected once the clock skew window passes.
    const { url, headers } = signRequest({
      method: 'PUT',
      key: file.key,
      body,
      headers: {
        'content-type': CONTENT_TYPES[ext] || 'application/octet-stream',
        // Keys are content-addressed by path and never rewritten in place, so a
        // long immutable cache is safe and keeps R2 egress/class-A ops down.
        'cache-control': 'public, max-age=31536000, immutable'
      },
      ...cfg
    })
    try {
      const res = await fetch(url, { method: 'PUT', body, headers })
      if (res.ok) return
      const detail = (await res.text().catch(() => '')).slice(0, 200)
      lastError = new Error(`${res.status} ${res.statusText} — ${detail}`)
      // 4xx other than 408/429 means the request itself is wrong; retrying
      // an unauthorized or malformed PUT just wastes time.
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) throw lastError
    } catch (err) {
      lastError = err
      if (err === lastError && /^\d{3} /.test(String(err.message))) throw err
    }
    if (attempt < MAX_ATTEMPTS) await sleep(500 * 2 ** (attempt - 1))
  }
  throw lastError
}

let uploaded = 0, skipped = 0, failed = 0, sentBytes = 0
const failures = []

async function handle(file) {
  const label = file.key.length > 58 ? '…' + file.key.slice(-57) : file.key
  try {
    if (VERIFY_ONLY) {
      const remote = await head(file)
      const ok = remote.exists && sizeMatches(remote, file.size)
      if (ok) skipped++
      else { failed++; failures.push(`${file.key} — ${remote.exists ? `size ${remote.size} != local ${file.size}` : 'MISSING'}`) }
      console.log(`  ${ok ? 'ok     ' : 'BAD    '} ${label}${remote.exists && remote.size === null ? ' (present; size not comparable)' : ''}`)
      return
    }
    if (!FORCE) {
      const remote = await head(file)
      if (remote.exists && sizeMatches(remote, file.size)) {
        skipped++
        console.log(`  skip    ${label}`)
        return
      }
    }
    if (DRY_RUN) {
      uploaded++
      console.log(`  would   ${label} (${mb(file.size)} MB)`)
      return
    }
    await put(file)
    uploaded++
    sentBytes += file.size
    console.log(`  sent    ${label} (${mb(file.size)} MB)`)
  } catch (err) {
    failed++
    failures.push(`${file.key} — ${err.message}`)
    console.log(`  FAIL    ${label}: ${err.message}`)
  }
}

// Fixed-size worker pool: R2 rate-limits aggressive parallel writes, and this
// keeps memory flat regardless of how large the media set grows.
const queue = [...files]
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) await handle(queue.shift())
  })
)

console.log(`\n${VERIFY_ONLY ? 'verified' : DRY_RUN ? 'planned' : 'uploaded'}: ${uploaded}  skipped: ${skipped}  failed: ${failed}`)
if (sentBytes) console.log(`transferred: ${mb(sentBytes)} MB`)
if (failures.length) {
  console.log('\nfailures:')
  for (const f of failures.slice(0, 30)) console.log(`  ${f}`)
  process.exit(1)
}
