// Verification utility for the R2 media migration.
//
// Usage:
//   node scripts/verify-r2-media-migration.mjs
//
// Checks:
//   A. Database: count of storage_provider values
//   B. Every migrated record has a non-empty storage_path
//   C. Every R2 object exists
//   D. The generated public URL is valid/reachable
//   E. No media record was lost

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { signRequest } from './r2-sign.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')

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
  publicUrl: (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, ''),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
}

const missing = Object.entries(cfg)
  .filter(([k, v]) => !v)
  .map(([k]) => k)
if (missing.length > 0) {
  console.error('Missing required environment variables:')
  for (const k of missing) console.error(`  - ${k}`)
  process.exit(1)
}

const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
const R2_UPLOAD_PREFIX = 'uploads'
const PUBLIC_MEDIA_BUCKET = 'public-media'

function getExt(filePath) {
  const raw = filePath.split('.').pop() || ''
  return raw.replace(/[^a-z0-9]/g, '').toLowerCase() || 'bin'
}

function buildR2Key(mediaId, ext) {
  return `${R2_UPLOAD_PREFIX}/legacy/${mediaId}.${ext}`
}

async function getMediaCounts() {
  const { count: r2Count } = await supabase.from('media').select('*', { count: 'exact', head: true }).eq('storage_provider', 'cloudflare_r2')
  const { count: supabaseCount } = await supabase.from('media').select('*', { count: 'exact', head: true }).eq('storage_provider', 'supabase_storage')
  const { count: totalCount } = await supabase.from('media').select('*', { count: 'exact', head: true })
  return { total: totalCount ?? 0, r2: r2Count ?? 0, supabase: supabaseCount ?? 0 }
}

async function getMissingStoragePath() {
  const { data, error } = await supabase
    .from('media')
    .select('id, storage_path')
    .eq('storage_provider', 'cloudflare_r2')
    .or('storage_path.is.null,storage_path.eq.')
  if (error) throw error
  return data ?? []
}

async function getMissingR2Objects() {
  const { data, error } = await supabase
    .from('media')
    .select('id, storage_path')
    .eq('storage_provider', 'cloudflare_r2')
    .not('storage_path', 'is', null)
  if (error) throw error

  const missing = []
  for (const rec of (data ?? [])) {
    const ext = getExt(rec.storage_path || '')
    const r2Key = buildR2Key(rec.id, ext)
    const { url, headers } = signRequest({
      method: 'HEAD',
      endpoint: cfg.endpoint,
      bucket: cfg.bucket,
      key: r2Key,
      headers: {},
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    })
    try {
      const res = await fetch(url, { method: 'HEAD', headers })
      if (!res.ok) missing.push({ id: rec.id, r2Key, status: res.status })
    } catch (err) {
      missing.push({ id: rec.id, r2Key, error: err.message })
    }
  }
  return missing
}

async function getInvalidPublicUrls() {
  const { data, error } = await supabase
    .from('media')
    .select('id, public_url, storage_path')
    .eq('storage_provider', 'cloudflare_r2')
    .not('public_url', 'is', null)
  if (error) throw error

  const invalid = []
  for (const rec of (data ?? [])) {
    try {
      const res = await fetch(rec.public_url, { method: 'HEAD' })
      if (!res.ok) invalid.push({ id: rec.id, url: rec.public_url, status: res.status })
    } catch (err) {
      invalid.push({ id: rec.id, url: rec.public_url, error: err.message })
    }
  }
  return invalid
}

async function getTotalMediaCount() {
  const { count } = await supabase.from('media').select('*', { count: 'exact', head: true })
  return count ?? 0
}

async function main() {
  console.log('[VERIFIER] R2 Media Migration Verification')
  console.log()

  // A. Database counts
  const counts = await getMediaCounts()
  console.log('--- A. Database ---')
  console.log(`Total media: ${counts.total}`)
  console.log(`R2 media (storage_provider=cloudflare_r2): ${counts.r2}`)
  console.log(`Supabase media (storage_provider=supabase_storage): ${counts.supabase}`)

  // B. Missing storage_path
  const missingPaths = await getMissingStoragePath()
  console.log()
  console.log('--- B. Missing storage_path ---')
  if (missingPaths.length === 0) {
    console.log('All migrated records have non-empty storage_path.')
  } else {
    console.log(`Missing storage_path on ${missingPaths.length} records:`)
    for (const m of missingPaths) console.log(`  id=${m.id} storage_path=${m.storage_path}`)
  }

  // C. Missing R2 objects
  const missingR2 = await getMissingR2Objects()
  console.log()
  console.log('--- C. Missing R2 objects ---')
  if (missingR2.length === 0) {
    console.log('All R2 objects verified.')
  } else {
    console.log(`Missing R2 objects on ${missingR2.length} records:`)
    for (const m of missingR2) console.log(`  id=${m.id} key=${m.r2Key} status=${m.status}`)
  }

  // D. Invalid public URLs
  const invalidUrls = await getInvalidPublicUrls()
  console.log()
  console.log('--- D. Invalid public URLs ---')
  if (invalidUrls.length === 0) {
    console.log('All public URLs are valid/reachable.')
  } else {
    console.log(`Invalid public URLs on ${invalidUrls.length} records:`)
    for (const u of invalidUrls) console.log(`  id=${u.id} url=${u.url} status=${u.status}`)
  }

  // E. No lost records
  const totalDB = await getTotalMediaCount()
  console.log()
  console.log('--- E. Record integrity ---')
  console.log(`Total media in DB: ${totalDB}`)
  console.log(`R2 + Supabase = ${counts.r2 + counts.supabase}`)
  const lost = totalDB - (counts.r2 + counts.supabase)
  if (lost !== 0) {
    console.log(`WARNING: ${lost} records are unaccounted for (neither cloudflare_r2 nor supabase_storage)`)
  } else {
    console.log('All records accounted for.')
  }

  // Summary
  console.log()
  console.log('Verification result')
  console.log('-------------------')
  console.log(`Total media: ${counts.total}`)
  console.log(`R2 media: ${counts.r2}`)
  console.log(`Supabase media: ${counts.supabase}`)
  console.log(`Missing storage_path: ${missingPaths.length}`)
  console.log(`Missing R2 objects: ${missingR2.length}`)
  console.log(`Invalid public URLs: ${invalidUrls.length}`)
  console.log(`Successful: ${counts.r2 - missingR2.length - invalidUrls.length}`)

  const allPass = counts.supabase === 0 && missingPaths.length === 0 && missingR2.length === 0 && invalidUrls.length === 0 && lost === 0
  console.log()
  console.log(allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED')
  console.log(`Supabase Storage files were NOT deleted (see migration script note).`)

  if (!allPass) process.exit(1)
}

main().catch(err => {
  console.error('[VERIFIER] FATAL:', err)
  process.exit(1)
})
