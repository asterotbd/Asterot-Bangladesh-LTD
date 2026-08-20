"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../Button'

export type RoleOption = { roleId: string; name: string; description: string | null }

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

export default function UserRoleManager({
  userId,
  isSelf,
  assigned,
  allRoles
}: {
  userId: string
  isSelf: boolean
  assigned: RoleOption[]
  allRoles: RoleOption[]
}) {
  const router = useRouter()
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [confirming, setConfirming] = useState<RoleOption | null>(null)

  const label = (name: string) => ROLE_LABELS[name] || name
  const available = allRoles.filter((role) => !assigned.some((item) => item.roleId === role.roleId))
  const hasOwnSuperAdmin = isSelf && assigned.some((role) => role.name === 'super_admin')

  async function assignRole(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoleId || busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId: selectedRoleId })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to assign the role.' })
        return
      }
      setSelectedRoleId('')
      setFeedback({ kind: 'success', message: 'Role assigned successfully.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to assign the role.' })
    } finally {
      setBusy(false)
    }
  }

  async function removeRole() {
    if (!confirming || busy) return
    const target = confirming
    setConfirming(null)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/user-roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId: target.roleId })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to remove the role.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Role removed successfully.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to remove the role.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-panel">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">Role Management</h2>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Assigned Roles</h3>
          {assigned.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No roles assigned.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {assigned.map((role) => {
                const removeDisabled = busy || (isSelf && role.name === 'super_admin')
                return (
                  <li key={role.roleId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{label(role.name)}</p>
                      {role.description && <p className="mt-0.5 truncate text-xs text-gray-500">{role.description}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={removeDisabled}
                      onClick={() => setConfirming(role)}
                      title={isSelf && role.name === 'super_admin' ? 'You cannot remove your own super admin role' : undefined}
                      className="shrink-0 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {hasOwnSuperAdmin && (
            <p className="mt-2 text-xs text-gray-500">You cannot remove your own super admin role.</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Add Role</h3>
          {available.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">This user already has all available roles.</p>
          ) : (
            <form onSubmit={assignRole} className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block flex-1 min-w-[12rem]">
                <span className="sr-only">Select a role to assign</span>
                <select
                  value={selectedRoleId}
                  onChange={(e) => {
                    setSelectedRoleId(e.target.value)
                    setFeedback(null)
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
                >
                  <option value="">Select a role…</option>
                  {available.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {label(role.name)}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" disabled={busy || !selectedRoleId}>
                {busy ? 'Working…' : 'Assign Role'}
              </Button>
            </form>
          )}
        </div>

        {feedback && (
          <div
            className={
              feedback.kind === 'success'
                ? 'rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200'
                : 'rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200'
            }
          >
            {feedback.message}
          </div>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && setConfirming(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Remove ${label(confirming.name)} role`}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Remove {label(confirming.name)} role?</h3>
            <p className="mt-2 text-sm text-gray-400">
              This will immediately change this user&#39;s administrative permissions.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirming(null)} className="btn btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={removeRole}
                disabled={busy}
                className="rounded-full border border-red-500/25 bg-red-500/10 px-6 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
              >
                {busy ? 'Removing…' : 'Remove Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
