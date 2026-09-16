"use client"
import { useState } from 'react'
import ImageFilePicker, { type PickedFile } from './ImageFilePicker'
import { uploadImages, type UploadState } from '../../lib/uploadClient'

export type UploadSummary = { mediaIds: string[]; failed: number }

/**
 * Pick images from the device and upload them straight to R2, optionally
 * appending them to an album. Failed files stay selected with their error so
 * a second click retries only those.
 */
export default function DeviceImageUploader({
  albumId = null,
  onUploaded,
  onBusyChange,
  disabledReason = null
}: {
  albumId?: string | null
  onUploaded?: (summary: UploadSummary) => void | Promise<void>
  /** Lets a surrounding dialog refuse to close while files are in flight. */
  onBusyChange?: (busy: boolean) => void
  disabledReason?: string | null
}) {
  const [files, setFiles] = useState<PickedFile[]>([])
  const [states, setStates] = useState<Record<string, UploadState>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const pending = files.filter((f) => states[f.id]?.status !== 'done')
  const finished = files.length - pending.length
  const overall = pending.length
    ? Math.round((pending.reduce((sum, f) => sum + (states[f.id]?.progress ?? 0), 0) / pending.length) * 100)
    : 100

  async function upload() {
    if (busy || pending.length === 0 || disabledReason) return
    setBusy(true)
    onBusyChange?.(true)
    setMessage(null)
    // Clear stale errors so retried files start from a clean state.
    setStates((prev) => {
      const next = { ...prev }
      for (const f of pending) delete next[f.id]
      return next
    })

    const outcomes = await uploadImages(
      pending.map((f) => ({ id: f.id, file: f.file })),
      { albumId, onUpdate: (id, state) => setStates((prev) => ({ ...prev, [id]: state })) }
    )
    const mediaIds = outcomes.flatMap((o) => (o.ok && o.mediaId ? [o.mediaId] : []))
    const failed = outcomes.length - mediaIds.length

    setMessage(
      failed === 0
        ? { kind: 'success', text: `${mediaIds.length} photo${mediaIds.length === 1 ? '' : 's'} uploaded.` }
        : { kind: 'error', text: `${mediaIds.length} uploaded, ${failed} failed. Remove or fix the files marked in red, then upload again.` }
    )
    setBusy(false)
    onBusyChange?.(false)
    await onUploaded?.({ mediaIds, failed })
  }

  function clearFinished() {
    setFiles((prev) => prev.filter((f) => states[f.id]?.status !== 'done'))
    setMessage(null)
  }

  return (
    <div className="space-y-4">
      <ImageFilePicker
        files={files}
        onChange={(next) => {
          setFiles(next)
          setMessage(null)
        }}
        states={states}
        disabled={busy || Boolean(disabledReason)}
      />

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {disabledReason && <p className="mr-auto text-xs text-amber-200/80">{disabledReason}</p>}
        {finished > 0 && !busy && (
          <button type="button" onClick={clearFinished} className="btn btn-ghost btn-sm">Clear uploaded</button>
        )}
        <button
          type="button"
          onClick={() => void upload()}
          disabled={busy || pending.length === 0 || Boolean(disabledReason)}
          className="btn btn-primary"
        >
          {busy
            ? `Uploading… ${overall}%`
            : pending.length > 0
              ? `Upload ${pending.length} photo${pending.length === 1 ? '' : 's'}`
              : 'Upload'}
        </button>
      </div>
    </div>
  )
}
