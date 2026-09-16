"use client"
import { useEffect, useRef, useState } from 'react'
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, describeImageProblem } from '../../lib/uploadRules'
import type { UploadState } from '../../lib/uploadClient'

export type PickedFile = { id: string; file: File; previewUrl: string }

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Stable across re-selecting the same file, which is what de-duplication keys on.
const fileId = (f: File) => `${f.name}:${f.size}:${f.lastModified}`

/**
 * Controlled image picker: drag-and-drop or browse, with previews and an
 * optional per-file upload state overlay. It only selects files; the parent
 * decides when and where to upload them.
 */
export default function ImageFilePicker({
  files,
  onChange,
  states = {},
  disabled = false,
  multiple = true
}: {
  files: PickedFile[]
  onChange: (files: PickedFile[]) => void
  states?: Record<string, UploadState>
  disabled?: boolean
  multiple?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // Object URLs hold the file in memory until revoked. Revoke previews that
  // were removed from the selection, and everything on unmount.
  const tracked = useRef<PickedFile[]>([])
  useEffect(() => {
    const live = new Set(files.map((f) => f.previewUrl))
    for (const f of tracked.current) if (!live.has(f.previewUrl)) URL.revokeObjectURL(f.previewUrl)
    tracked.current = files
  }, [files])
  useEffect(() => () => {
    for (const f of tracked.current) URL.revokeObjectURL(f.previewUrl)
  }, [])

  function add(list: FileList | null) {
    if (!list || disabled) return
    const known = new Set(files.map((f) => f.id))
    const incoming: PickedFile[] = []
    for (const file of Array.from(list)) {
      const id = fileId(file)
      if (known.has(id)) continue
      known.add(id)
      incoming.push({ id, file, previewUrl: URL.createObjectURL(file) })
    }
    onChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1))
  }

  const remove = (id: string) => onChange(files.filter((f) => f.id !== id))

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          add(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-white/15 bg-black/30'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-gray-400">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M17 8l-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <p className="text-sm text-gray-300">
          {dragging ? 'Drop to add' : multiple ? 'Drag photos here, or' : 'Drag a photo here, or'}{' '}
          {!dragging && (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="font-semibold text-primary underline-offset-4 hover:underline disabled:no-underline">
              browse your device
            </button>
          )}
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG, GIF, WebP, AVIF or BMP · up to {MAX_IMAGE_BYTES / 1024 / 1024} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            add(e.target.files)
            // Allow picking the same file again after removing it.
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map(({ id, file, previewUrl }) => {
            const state = states[id]
            const problem = state ? null : describeImageProblem(file)
            const error = state?.status === 'error' ? state.error : problem
            const locked = state?.status === 'uploading' || state?.status === 'processing' || state?.status === 'done'
            return (
              <li key={id} className={`relative overflow-hidden rounded-xl border bg-black/40 ${error ? 'border-red-500/40' : 'border-white/10'}`}>
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview, nothing to optimize */}
                  <img src={previewUrl} alt="" className={`h-full w-full object-cover ${state?.status === 'done' ? '' : 'opacity-90'}`} />

                  {(state?.status === 'uploading' || state?.status === 'processing') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-end bg-black/50 p-2">
                      <span className="mb-1.5 text-xs font-medium text-white">
                        {state.status === 'processing' ? 'Saving…' : `${Math.round(state.progress * 100)}%`}
                      </span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.round(state.progress * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {state?.status === 'done' && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-black" aria-label="Uploaded">
                      ✓
                    </span>
                  )}

                  {!locked && (
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      disabled={disabled}
                      aria-label={`Remove ${file.name}`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-500/80"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs text-gray-200" title={file.name}>{file.name}</p>
                  <p className={`mt-0.5 text-[11px] leading-snug ${error ? 'text-red-300' : 'text-gray-500'}`}>
                    {error || formatSize(file.size)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
