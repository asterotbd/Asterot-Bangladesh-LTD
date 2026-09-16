// Browser side of a direct upload: presign -> PUT straight to R2 -> complete.
//
// Files go from the browser to the R2 bucket and never pass through a Vercel
// function, so they are not subject to its 4.5 MB request-body limit and are
// stored at full size. Only call this from event handlers in client
// components; it relies on XMLHttpRequest for upload progress, which fetch
// does not expose.
//
// The browser will only PUT to R2 if the bucket's CORS policy allows this
// site's origin. Without that policy every upload fails before it starts.

import { MAX_FILES_PER_UPLOAD, describeImageProblem } from './uploadRules'

export type UploadStatus = 'uploading' | 'processing' | 'done' | 'error'
export type UploadState = { status: UploadStatus; progress: number; error?: string; mediaId?: string }

export type UploadItem = {
  id: string
  file: File
  alt_en?: string
  caption_en?: string
  category?: string
}

export type UploadOutcome = { id: string; ok: boolean; mediaId?: string; error?: string }

type Presigned = { key?: string; url?: string; headers?: Record<string, string>; error?: string }
type Completed = { key: string; ok: boolean; mediaId?: string; error?: string }

// Several parallel PUTs are faster, but too many large originals over a home
// uplink starve each other and time out.
const PUT_CONCURRENCY = 3

// Set once any PUT in this page session succeeds. Until then, a request that
// gets no HTTP response is almost certainly the bucket's CORS policy rejecting
// the browser, not a flaky connection.
let reachedStorage = false

const CORS_BLOCKED =
  'The R2 bucket is blocking uploads from this site because it has no CORS policy. ' +
  'In Cloudflare, open R2 → jihan-project → Settings → CORS Policy and add one that allows PUT from this site.'

/** The request never got an HTTP response: CORS rejection, offline, or dropped. */
class UnreachableError extends Error {}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`)
  return data as T
}

function putWithProgress(url: string, headers: Record<string, string>, file: File, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total)
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage rejected the upload (${xhr.status}).`))
    xhr.onerror = () => reject(new UnreachableError('The upload was interrupted. Check your connection and try again.'))
    xhr.send(file)
  })
}

async function putToStorage(url: string, headers: Record<string, string>, file: File, onProgress: (fraction: number) => void) {
  try {
    await putWithProgress(url, headers, file, onProgress)
  } catch (err) {
    if (!(err instanceof UnreachableError)) throw err
    // Before storage has ever answered, a network-level failure is the CORS
    // policy; retrying cannot help, so say what to fix instead.
    if (!reachedStorage) throw new Error(CORS_BLOCKED)
    // Storage is reachable, so this was a dropped connection on a large file,
    // which is common and transient. The presigned URL is still valid.
    onProgress(0)
    await putWithProgress(url, headers, file, onProgress)
  }
  reachedStorage = true
}

export async function uploadImages(
  items: UploadItem[],
  { albumId = null, onUpdate }: { albumId?: string | null; onUpdate: (id: string, state: UploadState) => void }
): Promise<UploadOutcome[]> {
  const outcomes = new Map<string, UploadOutcome>()
  const fail = (id: string, error: string) => {
    outcomes.set(id, { id, ok: false, error })
    onUpdate(id, { status: 'error', progress: 0, error })
  }

  const valid: UploadItem[] = []
  for (const item of items) {
    const problem = describeImageProblem(item.file)
    if (problem) fail(item.id, problem)
    else valid.push(item)
  }

  for (let start = 0; start < valid.length; start += MAX_FILES_PER_UPLOAD) {
    const batch = valid.slice(start, start + MAX_FILES_PER_UPLOAD)

    let presigned: Presigned[]
    try {
      presigned = (await postJson<{ uploads: Presigned[] }>('/api/admin/uploads/presign', {
        files: batch.map((b) => ({ name: b.file.name, size: b.file.size }))
      })).uploads
    } catch (err) {
      for (const b of batch) fail(b.id, (err as Error).message)
      continue
    }

    const uploaded: { item: UploadItem; key: string; position: number }[] = []
    const queue = batch.map((item, position) => ({ item, entry: presigned[position], position }))
    await Promise.all(
      Array.from({ length: Math.min(PUT_CONCURRENCY, queue.length) }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const { item, entry, position } = next
          if (!entry?.url || !entry.key || !entry.headers) {
            fail(item.id, entry?.error || 'Could not prepare the upload.')
            continue
          }
          onUpdate(item.id, { status: 'uploading', progress: 0 })
          try {
            await putToStorage(entry.url, entry.headers, item.file, (p) => onUpdate(item.id, { status: 'uploading', progress: p }))
            onUpdate(item.id, { status: 'processing', progress: 1 })
            uploaded.push({ item, key: entry.key, position })
          } catch (err) {
            fail(item.id, (err as Error).message)
          }
        }
      })
    )
    if (uploaded.length === 0) continue

    // Parallel PUTs finish in any order; complete in selection order so photos
    // land in an album in the order the admin picked them.
    uploaded.sort((a, b) => a.position - b.position)
    try {
      const { results } = await postJson<{ results: Completed[] }>('/api/admin/uploads/complete', {
        albumId,
        uploads: uploaded.map(({ item, key }) => ({
          key,
          alt_en: item.alt_en,
          caption_en: item.caption_en,
          category: item.category
        }))
      })
      const byKey = new Map(results.map((r) => [r.key, r]))
      for (const { item, key } of uploaded) {
        const result = byKey.get(key)
        if (result?.ok) {
          outcomes.set(item.id, { id: item.id, ok: true, mediaId: result.mediaId })
          onUpdate(item.id, { status: 'done', progress: 1, mediaId: result.mediaId })
        } else {
          fail(item.id, result?.error || 'Could not save the upload.')
        }
      }
    } catch (err) {
      for (const { item } of uploaded) fail(item.id, (err as Error).message)
    }
  }

  return items.map((item) => outcomes.get(item.id) ?? { id: item.id, ok: false, error: 'Not uploaded.' })
}
