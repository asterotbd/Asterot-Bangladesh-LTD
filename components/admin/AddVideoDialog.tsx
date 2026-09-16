"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageFilePicker, { type PickedFile } from './ImageFilePicker'
import { uploadImages, type UploadState } from '../../lib/uploadClient'
import { parseYoutubeUrl, youtubeThumbnailUrl } from '../../lib/youtubeUrl'

type Lookup = { youtubeId: string; isShort: boolean; title: string | null; found: boolean; alreadyAdded: boolean }

// Local calendar date. toISOString() would give the UTC date, which in
// Bangladesh (UTC+6) is still "yesterday" until 6 AM.
function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const deleteMedia = (id: string) => fetch(`/api/admin/media/${id}`, { method: 'DELETE' }).catch(() => null)

export default function AddVideoDialog({ categories }: { categories: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  // A ref, not state: the debounced lookup must see edits made while it waits.
  const titleEdited = useRef(false)
  const [category, setCategory] = useState('')
  const [videoType, setVideoType] = useState<'video' | 'short'>('video')
  const [publishedAt, setPublishedAt] = useState(today())
  const [published, setPublished] = useState(true)
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [thumbFiles, setThumbFiles] = useState<PickedFile[]>([])
  const [thumbStates, setThumbStates] = useState<Record<string, UploadState>>({})
  const [phase, setPhase] = useState<'idle' | 'thumbnail' | 'saving'>('idle')
  const [error, setError] = useState<string | null>(null)

  // A thumbnail is uploaded before the video is created. If creation fails the
  // admin can fix the form and retry without re-uploading; if they give up,
  // the unused image is deleted so it does not linger in the media library.
  const uploadedThumb = useRef<{ fileId: string; mediaId: string } | null>(null)

  const parsed = parseYoutubeUrl(url)
  const youtubeId = parsed?.youtubeId ?? null
  const linkIsShort = parsed?.isShort ?? false
  const busy = phase !== 'idle'
  const thumbProgress = thumbFiles[0] ? Math.round((thumbStates[thumbFiles[0].id]?.progress ?? 0) * 100) : 0

  useEffect(() => {
    if (!youtubeId) {
      setLookup(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setLookingUp(true)
      try {
        const res = await fetch(`/api/admin/videos/lookup?url=${encodeURIComponent(youtubeId)}`)
        const data = (await res.json().catch(() => null)) as Lookup | null
        if (cancelled || !res.ok || !data) return
        setLookup(data)
        if (data.title && !titleEdited.current) setTitle(data.title)
      } finally {
        if (!cancelled) setLookingUp(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // Re-run only when the pasted link resolves to a different video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId])

  // The link decides Short vs regular video until the admin overrides it.
  useEffect(() => {
    if (youtubeId) setVideoType(linkIsShort ? 'short' : 'video')
  }, [youtubeId, linkIsShort])

  function reset() {
    setUrl('')
    setTitle('')
    titleEdited.current = false
    setCategory('')
    setVideoType('video')
    setPublishedAt(today())
    setPublished(true)
    setLookup(null)
    setThumbFiles([])
    setThumbStates({})
    setError(null)
    uploadedThumb.current = null
  }

  function close() {
    if (busy) return
    if (uploadedThumb.current) void deleteMedia(uploadedThumb.current.mediaId)
    reset()
    setOpen(false)
  }

  function changeThumbnail(next: PickedFile[]) {
    // Swapping or removing an already-uploaded thumbnail orphans it.
    if (uploadedThumb.current && uploadedThumb.current.fileId !== next[0]?.id) {
      void deleteMedia(uploadedThumb.current.mediaId)
      uploadedThumb.current = null
    }
    setThumbFiles(next)
    setThumbStates({})
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!parsed) return setError('Enter a valid YouTube video link.')
    if (!title.trim()) return setError('A title is required.')
    if (lookup?.alreadyAdded) return setError('This video is already on the Videos page.')
    setError(null)

    try {
      let thumbnailMediaId: string | null = null
      const thumb = thumbFiles[0]
      if (thumb) {
        if (uploadedThumb.current?.fileId === thumb.id) {
          thumbnailMediaId = uploadedThumb.current.mediaId
        } else {
          setPhase('thumbnail')
          const [outcome] = await uploadImages(
            [{ id: thumb.id, file: thumb.file, alt_en: title.trim(), category: 'Video thumbnails' }],
            { onUpdate: (id, state) => setThumbStates({ [id]: state }) }
          )
          if (!outcome.ok || !outcome.mediaId) {
            setError(outcome.error || 'The thumbnail could not be uploaded.')
            return
          }
          uploadedThumb.current = { fileId: thumb.id, mediaId: outcome.mediaId }
          thumbnailMediaId = outcome.mediaId
        }
      }

      setPhase('saving')
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsed.youtubeId, title: title.trim(), category: category.trim() || undefined, videoType, publishedAt, published, thumbnailMediaId })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to add the video.')
        return
      }

      // The thumbnail now belongs to the video; do not clean it up.
      uploadedThumb.current = null
      reset()
      setOpen(false)
      router.refresh()
    } catch {
      setError('Unable to add the video.')
    } finally {
      setPhase('idle')
    }
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  let linkStatus: { tone: 'muted' | 'ok' | 'warn' | 'bad'; text: string } | null = null
  if (url.trim() && !parsed) linkStatus = { tone: 'bad', text: 'That does not look like a YouTube video link.' }
  else if (lookingUp) linkStatus = { tone: 'muted', text: 'Checking the link…' }
  else if (lookup?.alreadyAdded) linkStatus = { tone: 'bad', text: 'This video is already on the Videos page.' }
  else if (lookup?.found) linkStatus = { tone: 'ok', text: 'Found on YouTube.' }
  else if (lookup) linkStatus = { tone: 'warn', text: 'Could not confirm this video on YouTube. It may be private or removed, or have embedding turned off, in which case it will not play on the site.' }
  const toneClass = { muted: 'text-gray-500', ok: 'text-emerald-300', warn: 'text-amber-200', bad: 'text-red-300' }

  const preview = thumbFiles[0]?.previewUrl ?? (youtubeId ? youtubeThumbnailUrl(youtubeId) : null)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">Add Video</button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={close} />
          <div role="dialog" aria-modal="true" aria-label="Add video" className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-panel shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Add Video</h3>
                <p className="mt-1 text-sm text-gray-400">Add a YouTube video by link. The channel sync will not change or remove it.</p>
              </div>
              <button type="button" onClick={close} disabled={busy} aria-label="Close" className="rounded-lg px-2 py-1 text-xl leading-none text-gray-400 transition-colors hover:text-white disabled:opacity-40">×</button>
            </div>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {error && <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{error}</div>}

                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="video-url">YouTube link *</label>
                  <input id="video-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} disabled={busy} autoFocus placeholder="https://www.youtube.com/watch?v=… or a Shorts / youtu.be link" className={inputClass} />
                  {linkStatus && <p className={`mt-1.5 text-xs ${toneClass[linkStatus.tone]}`}>{linkStatus.text}</p>}
                </div>

                {preview && (
                  <div className={`overflow-hidden rounded-xl border border-white/10 bg-black/40 ${videoType === 'short' ? 'mx-auto aspect-[9/16] w-40' : 'aspect-video w-full sm:w-80'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob or YouTube preview */}
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="video-title">Title *</label>
                  <input id="video-title" type="text" value={title} maxLength={300} disabled={busy} onChange={(e) => { setTitle(e.target.value); titleEdited.current = e.target.value.trim() !== '' }} className={inputClass} placeholder={lookingUp ? 'Fetching title from YouTube…' : ''} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-300" htmlFor="video-category">Category</label>
                    <input id="video-category" type="text" list="video-categories" value={category} maxLength={120} disabled={busy} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Latest" />
                    <datalist id="video-categories">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300" htmlFor="video-type">Type</label>
                    <select id="video-type" value={videoType} disabled={busy} onChange={(e) => setVideoType(e.target.value as 'video' | 'short')} className={inputClass}>
                      <option value="video">Video</option>
                      <option value="short">Short</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300" htmlFor="video-date">Publish date</label>
                    <input id="video-date" type="date" value={publishedAt} max={today()} disabled={busy} onChange={(e) => setPublishedAt(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-300">Custom thumbnail</p>
                  <p className="mb-3 mt-1 text-xs text-gray-500">Optional. Replaces YouTube’s thumbnail on the site.</p>
                  <ImageFilePicker files={thumbFiles} onChange={changeThumbnail} states={thumbStates} disabled={busy} multiple={false} />
                </div>

                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={published} disabled={busy} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/40 accent-primary" />
                  <span className="text-sm font-medium text-gray-200">Show on the site</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
                <button type="button" onClick={close} disabled={busy} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={busy || !parsed || !title.trim() || Boolean(lookup?.alreadyAdded)} className="btn btn-primary">
                  {phase === 'thumbnail' ? `Uploading thumbnail… ${thumbProgress}%` : phase === 'saving' ? 'Adding…' : 'Add video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
