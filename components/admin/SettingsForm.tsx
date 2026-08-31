"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import type { DbSiteSetting } from '../../lib/settings-server'

export default function SettingsForm({ settings, canManage }: { settings: DbSiteSetting[]; canManage: boolean }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<DbSiteSetting | null>(null)
  const [deleting, setDeleting] = useState<DbSiteSetting | null>(null)
  const [key, setKey] = useState('')
  const [valueText, setValueText] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25'

  function parseValueForEdit(editing: DbSiteSetting | null, text: string): { ok: true; value: unknown } {
    // When editing an existing string-backed setting, always keep it a string.
    // This avoids corrupting values that merely look like JSON (e.g. "123",
    // "true", "null") when they round-trip through the textarea as plain text.
    if (editing && typeof editing.value === 'string') {
      const trimmed = text.trim()
      return { ok: true, value: trimmed === '' ? null : trimmed }
    }
    const trimmed = text.trim()
    if (trimmed === '') return { ok: true, value: null }
    try {
      return { ok: true, value: JSON.parse(trimmed) }
    } catch {
      // Not valid JSON — treat the input as ordinary plain text and store it
      // as a JSONB string. Admins never need to type JSON quoting by hand.
      return { ok: true, value: trimmed }
    }
  }

  function openEdit(setting: DbSiteSetting) {
    setEditing(setting)
    setKey(setting.key)
    setValueText(typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value, null, 2))
    setFeedback(null)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || busy) return
    const parsed = parseValueForEdit(editing, valueText)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), value: parsed.value })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to save the setting.' })
        return
      }
      setEditing(null)
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to save the setting.' })
    } finally {
      setBusy(false)
    }
  }

  async function addSetting(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const parsed = parseValueForEdit(null, valueText)
    if (!key.trim()) {
      setFeedback({ kind: 'error', message: 'A key is required.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), value: parsed.value })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to save the setting.' })
        return
      }
      setAdding(false)
      setKey('')
      setValueText('')
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to save the setting.' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleting || busy) return
    const target = deleting
    setDeleting(null)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to delete the setting.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Setting deleted.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to delete the setting.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {feedback.message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-panel">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">Settings</h2>
          {canManage && !adding && (
            <button type="button" onClick={() => { setAdding(true); setFeedback(null); }} className="btn btn-primary">Add Setting</button>
          )}
        </div>

        {settings.length === 0 && !adding ? (
          <p className="p-6 text-sm text-gray-500">No settings configured yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {settings.map((setting) => (
              <div key={setting.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-white">{setting.key}</p>
                  <p className="mt-0.5 max-w-xl truncate text-sm text-gray-500" title={typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)}>
                    {typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)}
                  </p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => openEdit(setting)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(setting)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {(adding || editing) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && (editing ? setEditing(null) : setAdding(false))} />
          <div role="dialog" aria-modal="true" aria-label="Setting form" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{editing ? `Edit setting · ${editing.key}` : 'Add setting'}</h3>
            <form onSubmit={editing ? saveEdit : addSetting} className="mt-5 space-y-4">
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="setting-key">Key</label>
                  <input id="setting-key" type="text" value={key} onChange={(e) => setKey(e.target.value)} maxLength={64} className={inputClass} placeholder="e.g. site.maintenance" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="setting-value">Value</label>
                <textarea id="setting-value" rows={5} value={valueText} onChange={(e) => setValueText(e.target.value)} className={`${inputClass} min-h-[7rem] resize-y font-mono text-xs`} placeholder="e.g. Asterot News &amp; Updates (plain text, or JSON if you need structured data)" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => (editing ? setEditing(null) : setAdding(false))} disabled={busy} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete setting "${deleting?.key ?? ''}"?`}
        description="This permanently removes the setting. This action cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}