"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import { Panel } from './Panel'
import type { DbCompanyInfo, DbLeader } from '../../lib/about-server'

type EditingLeader = { id?: string; name: string; position: string; short_bio_en: string; display_order: number }

export default function AboutForm({ company, leaders, canEdit }: { company: DbCompanyInfo | null; leaders: DbLeader[]; canEdit: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emptyLeader: EditingLeader = { name: '', position: '', short_bio_en: '', display_order: leaders.length }
  const [leaderForm, setLeaderForm] = useState<EditingLeader | null>(null)
  const [deleting, setDeleting] = useState<DbLeader | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  const companySections: { key: keyof DbCompanyInfo; label: string; rows: number }[] = [
    { key: 'name_en', label: 'Company name', rows: 1 },
    { key: 'tagline_en', label: 'Tagline', rows: 1 },
    { key: 'slogan_en', label: 'Slogan', rows: 1 },
    { key: 'location', label: 'Location', rows: 1 },
    { key: 'founded_date', label: 'Founded date', rows: 1 },
    { key: 'short_description_en', label: 'Short description', rows: 3 },
    { key: 'about_en', label: 'About text', rows: 6 },
    { key: 'story_en', label: 'Our story', rows: 6 },
    { key: 'what_we_do_en', label: 'What we do', rows: 6 },
    { key: 'approach_en', label: 'Our approach', rows: 6 },
    { key: 'seo_title', label: 'SEO title', rows: 1 },
    { key: 'seo_description', label: 'SEO description', rows: 2 }
  ]
  const [companyForm, setCompanyForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(companySections.map((s) => [s.key, String(company?.[s.key] ?? '')]))
  )

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !company) return
    setBusy(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'company', ...companyForm })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to save.')
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Unable to save.')
    } finally {
      setBusy(false)
    }
  }

  async function saveLeader(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !leaderForm) return
    if (!leaderForm.name.trim()) {
      setError('A name is required.')
      return
    }
    setBusy(true)
    setSaved(false)
    setError(null)
    try {
      const payload = {
        resource: 'leadership',
        ...(leaderForm.id ? { id: leaderForm.id } : {}),
        name: leaderForm.name,
        position: leaderForm.position || null,
        short_bio_en: leaderForm.short_bio_en || null,
        display_order: leaderForm.display_order
      }
      const res = await fetch('/api/admin/content/about', {
        method: leaderForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to save.')
        return
      }
      setLeaderForm(null)
      setSaved(true)
      router.refresh()
    } catch {
      setError('Unable to save.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleting || busy) return
    const target = deleting
    setDeleting(null)
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/about', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'leadership', id: target.id })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to delete.')
        return
      }
      setSaved(true)
      setError(null)
      router.refresh()
    } catch {
      setError('Unable to delete.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {(saved || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-amber-400/25 bg-amber-400/10 text-amber-200' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'}`}>
          {error ?? 'Saved successfully.'}
        </div>
      )}

      <Panel title="Company Information" description="Core company details used across the public site.">
        <form onSubmit={saveCompany} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {companySections.map((section) => (
            <div key={section.key} className={section.key === 'seo_title' || section.key === 'seo_description' ? '' : 'md:col-span-1'}>
              <label className="block text-sm font-medium text-gray-300" htmlFor={`cmp-${section.key}`}>{section.label}</label>
              {section.rows === 1 ? (
                <input id={`cmp-${section.key}`} type="text" value={companyForm[section.key] ?? ''} onChange={(e) => setCompanyForm({ ...companyForm, [section.key]: e.target.value })} className={inputClass} />
              ) : (
                <textarea id={`cmp-${section.key}`} rows={section.rows} value={companyForm[section.key] ?? ''} onChange={(e) => setCompanyForm({ ...companyForm, [section.key]: e.target.value })} className={`${inputClass} resize-y`} />
              )}
            </div>
          ))}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={busy || !company} className="btn btn-primary">{busy ? 'Saving…' : 'Save Company Info'}</button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Leadership Team"
        description="Team members shown on the About page."
        action={canEdit && !leaderForm ? (
          <button type="button" onClick={() => { setLeaderForm(emptyLeader); setError(null); }} className="btn btn-primary btn-sm">Add Member</button>
        ) : undefined}
      >
        {leaders.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No team members yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {leaders.map((leader) => (
              <div key={leader.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-white">{leader.name}</p>
                  <p className="text-sm text-gray-400">{leader.position || '—'}</p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => {
                      setLeaderForm({ id: leader.id, name: leader.name, position: leader.position ?? '', short_bio_en: leader.short_bio_en ?? '', display_order: leader.display_order ?? 0 })
                      setError(null)
                    }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(leader)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {leaderForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && setLeaderForm(null)} />
          <div role="dialog" aria-modal="true" aria-label="Team member form" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{leaderForm.id ? 'Edit Member' : 'Add Member'}</h3>
            <form onSubmit={saveLeader} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="lead-name">Name *</label>
                <input id="lead-name" type="text" value={leaderForm.name} maxLength={200} onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="lead-position">Position</label>
                <input id="lead-position" type="text" value={leaderForm.position} maxLength={300} onChange={(e) => setLeaderForm({ ...leaderForm, position: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="lead-bio">Short bio</label>
                <textarea id="lead-bio" rows={3} value={leaderForm.short_bio_en} maxLength={2000} onChange={(e) => setLeaderForm({ ...leaderForm, short_bio_en: e.target.value })} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="lead-order">Display order</label>
                <input id="lead-order" type="number" min={0} value={leaderForm.display_order} onChange={(e) => setLeaderForm({ ...leaderForm, display_order: Number(e.target.value) })} className={inputClass} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setLeaderForm(null)} disabled={busy} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Remove "${deleting?.name ?? ''}"?`}
        description="This permanently removes the team member."
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}