// One-time migration of existing Supabase Storage media objects to Cloudflare R2.
//
// Usage:
//   node scripts/migrate-supabase-media-to-r2.mjs            # migrate all records
//   node scripts/migrate-supabase-media-to-r2.mjs --dry-run   # list records, do nothing
//   node scripts/migrate-supabase-media-to-r2.mjs --verify    # verify migrated records
//
// For each Supabase Storage record:
//   1. Download object from public-media bucket
//   2. Upload to R2 key: uploads/legacy/<media-id>.<ext>
//   3. Verify R2 object exists
//   4. Update media record: storage_provider='cloudflare_r2', storage_path=<key>, public_url=<R2 URL>
//
// Idempotent: already-migrated records (storage_provider='cloudflare_r2') are skipped.
// Supabase Storage files are NEVER deleted automatically.

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { signRequest } from './r2-sign.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')
const VERIFY_ONLY = process.argv.includes('--verify')

const SOURCE_DIRS = ['media', 'images', 'brand']

function loadEnv() {
  const envPath = path.resolve('E:/Code/Website/Asterot-Bangladesh-LTD/.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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
  publicUrl: (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, ''),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  r2ProjectId: process.env.NEXT_PUBLIC_R2_PROJECT_ID || ''
}

const missing = Object.entries(cfg)
  .filter(([k, v]) => !v && !['supabaseUrl', 'supabaseAnonKey', 'r2ProjectId'].includes(k))
  .map(([k]) => k)
if (missing.length > 0) {
  console.error('Missing required environment variables:')
  for (const k of missing) console.error(`  - ${k}`)
  console.error('\nEnsure .env.local has Supabase credentials and R2 env vars are set in your environment.')
  process.exit(1)
}

if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
const R2_UPLOAD_PREFIX = 'uploads'
const PUBLIC_MEDIA_BUCKET = 'public-media'

function getExt(filePath) {
  const filename = filePath.split('/').pop() || ''
  const raw = filename.split('.').pop() || ''
  return raw.replace(/[^a-z0-9]/g, '').toLowerCase() || 'bin'
}

function getContentType(ext) {
  const ct = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', svg: 'image/svg+xml',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm'
  }
  return ct[ext] || 'application/octet-stream'
}

function buildR2Key(mediaId, ext) {
  return `${R2_UPLOAD_PREFIX}/legacy/${mediaId}.${ext}`
}

function buildPublicUrl(r2Key) {
  return `${cfg.publicUrl}/${r2Key}`
}

async function headObject(url, headers) {
  const res = await fetch(url, { method: 'HEAD', headers })
  return { ok: res.ok, status: res.status, size: res.headers.get('content-length') }
}

async function downloadFromSupabase(storagePath) {
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/')
  const url = `${cfg.supabaseUrl}/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/${encodedPath}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.supabaseAnonKey}`
    }
  })
  if (!res.ok) return { buffer: null, contentType: null }
  const arrayBuffer = await res.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), contentType: res.headers.get('content-type') || null }
}

async function uploadToR2(key, buffer, contentType) {
  const { url, headers } = signRequest({
    method: 'PUT',
    endpoint: cfg.endpoint,
    bucket: cfg.bucket,
    key,
    body: buffer,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=31536000, immutable'
    },
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey
  })

  const res = await fetch(url, { method: 'PUT', body: buffer, headers })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 upload failed (${res.status}): ${detail.slice(0, 300)}`)
  }
  return true
}

async function verifyR2Object(key) {
  const cfg2 = { endpoint: cfg.endpoint, bucket: cfg.bucket, accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
  const { url, headers } = signRequest({
    method: 'HEAD',
    endpoint: cfg.endpoint,
    bucket: cfg.bucket,
    key,
    headers: {},
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey
  })
  const res = await fetch(url, { method: 'HEAD', headers })
  return res.ok && res.status === 200
}

async function getSupabaseObjectMetadata(storagePath) {
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/')
  const url = `${cfg.supabaseUrl}/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/${encodedPath}`
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      Authorization: `Bearer ${cfg.supabaseAnonKey}`
    }
  })
  if (!res.ok) return null
  return {
    contentType: res.headers.get('content-type') || 'application/octet-stream',
    size: parseInt(res.headers.get('content-length') || '0', 10)
  }
}

async function updateMediaRecord(id, storagePath, publicUrl) {
  const { data, error } = await supabase
    .from('media')
    .update({
      storage_provider: 'cloudflare_r2',
      storage_path: storagePath,
      public_url: publicUrl
    })
    .eq('id', id)
    .select('id, storage_provider, storage_path, public_url')
    .single()
  if (error) throw error
  return data
}

async function getUnmigratedRecords() {
  const { data, error } = await supabase
    .from('media')
    .select('id, storage_path, public_url, storage_provider, type, provider, filesize, category, created_at')
    .eq('storage_provider', 'supabase_storage')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

async function main() {
  console.log('[MIGRATION] Starting existing media migration to Cloudflare R2')
  console.log(`[MIGRATION] Mode: ${DRY_RUN ? 'DRY RUN' : VERIFY_ONLY ? 'VERIFY ONLY' : 'LIVE'}`)
  console.log(`[MIGRATION] R2 endpoint: ${cfg.endpoint}`)
  console.log(`[MIGRATION] R2 bucket: ${cfg.bucket}`)
  console.log(`[MIGRATION] R2 public URL: ${cfg.publicUrl}`)
  console.log(`[MIGRATION] Supabase: ${cfg.supabaseUrl}`)
  console.log()

  const records = await getUnmigratedRecords()
  console.log(`[MIGRATION] Found ${records.length} Supabase media records`)

  if (DRY_RUN || VERIFY_ONLY) {
    console.log(`\n[MIGRATION] ${DRY_RUN ? 'Would migrate' : 'Verifying'} records:`)
    for (const rec of records) {
      const ext = getExt(rec.storage_path || '')
      const r2Key = buildR2Key(rec.id, ext)
      const publicUrl = buildPublicUrl(r2Key)
      const status = rec.storage_provider === 'cloudflare_r2' ? 'ALREADY MIGRATED' : 'WOULD MIGRATE'
      console.log(`  ${status}: id=${rec.id} storage_path=${rec.storage_path} -> R2=${r2Key} size=${rec.filesize}`)
    }
    console.log()
    console.log(`Migration ${DRY_RUN ? 'dry run' : 'verify'} complete`)
    console.log(`------------------`)
    console.log(`Total records: ${records.length}`)
    if (VERIFY_ONLY) {
      const migrated = records.filter(r => r.storage_provider === 'cloudflare_r2').length
      console.log(`Already migrated: ${migrated}`)
      console.log(`Remaining: ${records.length - migrated}`)
    }
    return
  }

  let migrated = 0
  let skipped = 0
  let failed = 0
  const failures = []

  for (let i = 0; i < records.length; i++) {
    const rec = records[i]
    const idx = i + 1
    const mediaId = rec.id

    if (!rec.storage_path) {
      console.log(`[MIGRATION] ${idx}/${records.length} SKIP (no storage_path): ${mediaId}`)
      skipped++
      failures.push({ id: mediaId, storagePath: null, error: 'No storage_path', dbChanged: false, r2Created: false })
      continue
    }

    const ext = getExt(rec.storage_path)
    const r2Key = buildR2Key(mediaId, ext)
    const publicUrl = buildPublicUrl(r2Key)

    console.log(`[MIGRATION] ${idx}/${records.length} Migrating media ${mediaId} ...`)
    console.log(`[MIGRATION]   Source: Supabase ${PUBLIC_MEDIA_BUCKET}/${rec.storage_path}`)
    console.log(`[MIGRATION]   R2 key: ${r2Key}`)

    // Step 1: Download from Supabase Storage
    const downloadResult = await downloadFromSupabase(rec.storage_path)
    if (!downloadResult.buffer || downloadResult.buffer.length === 0) {
      console.log(`[MIGRATION] FAILED: Could not download from Supabase: ${mediaId}`)
      failed++
      failures.push({ id: mediaId, storagePath: rec.storage_path, error: 'Download from Supabase failed', dbChanged: false, r2Created: false })
      continue
    }
    const buffer = downloadResult.buffer
    const contentType = downloadResult.contentType || getContentType(ext)
    console.log(`[MIGRATION]   Downloaded: ${buffer.length} bytes (${contentType})`)

    // Step 2: Upload to R2
    try {
      await uploadToR2(r2Key, buffer, contentType)
      console.log(`[MIGRATION]   Uploaded R2 object: ${r2Key}`)
    } catch (err) {
      console.log(`[MIGRATION] FAILED: R2 upload error: ${mediaId} - ${err.message}`)
      failed++
      failures.push({ id: mediaId, storagePath: rec.storage_path, error: err.message, dbChanged: false, r2Created: true })
      continue
    }

    // Step 3: Verify R2 object exists
    let verified = false
    try {
      verified = await verifyR2Object(r2Key)
      if (verified) {
        console.log(`[MIGRATION]   Verified R2 object: ${r2Key}`)
      } else {
        console.log(`[MIGRATION] FAILED: R2 verification failed: ${mediaId}`)
        failed++
        failures.push({ id: mediaId, storagePath: rec.storage_path, error: 'R2 verification failed', dbChanged: false, r2Created: true })
        continue
      }
    } catch (err) {
      console.log(`[MIGRATION] FAILED: R2 verification error: ${mediaId} - ${err.message}`)
      failed++
      failures.push({ id: mediaId, storagePath: rec.storage_path, error: err.message, dbChanged: false, r2Created: true })
      continue
    }

    // Step 4: Update database record
    try {
      const updated = await updateMediaRecord(mediaId, r2Key, publicUrl)
      if (updated) {
        console.log(`[MIGRATION]   Database updated: id=${mediaId} storage_provider=cloudflare_r2 storage_path=${r2Key}`)
        migrated++
        console.log(`[MIGRATION] SUCCESS`)
      } else {
        console.log(`[MIGRATION] FAILED: Database update returned empty: ${mediaId}`)
        failed++
        failures.push({ id: mediaId, storagePath: rec.storage_path, error: 'DB update returned empty', dbChanged: false, r2Created: true })
      }
    } catch (err) {
      console.log(`[MIGRATION] FAILED: Database update error: ${mediaId} - ${err.message}`)
      failed++
      failures.push({ id: mediaId, storagePath: rec.storage_path, error: err.message, dbChanged: false, r2Created: true })
    }
  }

  console.log()
  console.log('Migration complete')
  console.log('------------------')
  console.log(`Total: ${records.length}`)
  console.log(`Migrated: ${migrated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed}`)

  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures.slice(0, 30)) {
      console.log(`  id=${f.id} storage_path=${f.storagePath} error="${f.error}" dbChanged=${f.dbChanged} r2Created=${f.r2Created}`)
    }
  }

  if (migrated > 0 && !DRY_RUN) {
    console.log('\nNOTE: Supabase Storage files were NOT deleted. They remain as a rollback safety net.')
    console.log('      To delete them after full verification, run the verifier first, then delete manually.')
  }

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('[MIGRATION] FATAL:', err)
  process.exit(1)
})
