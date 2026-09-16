"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadImages } from '../../lib/uploadClient'
import { IMAGE_ACCEPT } from '../../lib/uploadRules'

export default function MediaUploader() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [altEn, setAltEn] = useState('')
  const [captionEn, setCaptionEn] = useState('')
  const [category, setCategory] = useState('')

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25'

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setFeedback({ kind: 'error', message: 'Choose a file to upload.' })
      return
    }
    setBusy(true)
    setProgress(0)
    setFeedback(null)
    try {
      // Sent directly to R2 rather than as multipart to /api/admin/media, which
      // would exceed Vercel's 4.5 MB function body limit for ordinary photos.
      const [outcome] = await uploadImages(
        [{ id: 'media-upload', file, alt_en: altEn, caption_en: captionEn, category }],
        { onUpdate: (_, state) => setProgress(state.progress) }
      )
      if (!outcome.ok) {
        setFeedback({ kind: 'error', message: outcome.error || 'Unable to upload the file.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Uploaded successfully.' })
      setAltEn('')
      setCaptionEn('')
      setCategory('')
      fileInput.value = ''
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to upload the file.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn btn-primary">
        Upload Media
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Upload media" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Upload Media</h3>
            <p className="mt-1 text-sm text-gray-400">JPG, PNG, GIF, WebP, AVIF or BMP, full size. Uploaded straight to Cloudflare R2.</p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="media-file">File</label>
                <input id="media-file" name="file" type="file" accept={IMAGE_ACCEPT} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="media-alt">Alt text</label>
                <input id="media-alt" type="text" value={altEn} onChange={(e) => setAltEn(e.target.value)} maxLength={300} className={inputClass} placeholder="Descriptive alt text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="media-caption">Caption</label>
                <input id="media-caption" type="text" value={captionEn} onChange={(e) => setCaptionEn(e.target.value)} maxLength={500} className={inputClass} placeholder="Optional caption" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="media-category">Category</label>
                <input id="media-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={120} className={inputClass} placeholder="e.g. Events, Corporate" />
              </div>

              {feedback && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
                  {feedback.message}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} disabled={busy} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="btn btn-primary">
                  {busy ? `Uploading… ${Math.round(progress * 100)}%` : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}