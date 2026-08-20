"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RoleDescriptionForm({ roleId, roleName, initialDescription }: { roleId: string; roleName: string; initialDescription: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialDescription)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: value.trim() })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to save the description.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Description saved.' })
      setDirty(false)
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to save the description.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Description</span>
        <textarea
          rows={2}
          value={value}
          maxLength={500}
          onChange={(e) => {
            setValue(e.target.value)
            setDirty(true)
          }}
          className={`${inputClass} resize-y`}
          placeholder="Describe what this role can do…"
        />
      </label>

      {feedback && (
        <p className={`text-xs ${feedback.kind === 'success' ? 'text-emerald-300' : 'text-amber-300'}`}>{feedback.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy || !dirty} className="btn btn-primary">
          {busy ? 'Saving…' : 'Save description'}
        </button>
        {dirty && !busy && (
          <button
            type="button"
            onClick={() => {
              setValue(initialDescription)
              setDirty(false)
            }}
            className="btn btn-ghost"
          >
            Reset
          </button>
        )}
        <span className="text-xs text-gray-500">Role: {roleName}</span>
      </div>
    </form>
  )
}