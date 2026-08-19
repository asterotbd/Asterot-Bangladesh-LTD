"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../Button'

type ProfileValues = { display_name: string; full_name: string; locale: string; phone: string; bio: string }

const MAX: Record<keyof ProfileValues, number> = {
  display_name: 120,
  full_name: 160,
  locale: 16,
  phone: 30,
  bio: 500
}

const EMPTY: ProfileValues = { display_name: '', full_name: '', locale: '', phone: '', bio: '' }

function validate(values: ProfileValues): Partial<Record<keyof ProfileValues, string>> {
  const errors: Partial<Record<keyof ProfileValues, string>> = {}
  for (const key of Object.keys(MAX) as (keyof ProfileValues)[]) {
    if (values[key].trim().length > MAX[key]) errors[key] = `Maximum ${MAX[key]} characters.`
  }
  return errors
}

function inputClass(hasError: boolean) {
  return `mt-1 w-full rounded-xl border bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:ring-2 ${
    hasError
      ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400/25'
      : 'border-white/10 focus:border-primary focus:ring-primary/25'
  }`
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-2 text-sm text-red-400">{message}</p>
}

export default function UserProfileForm({ userId, initial }: { userId: string; initial: ProfileValues }) {
  const router = useRouter()
  const [values, setValues] = useState<ProfileValues>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileValues, string>>>({})
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()

  useEffect(() => {
    setValues({ ...EMPTY, ...initial })
    setLoaded(true)
  }, [userId, initial])

  const setField = (field: keyof ProfileValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSaveError(undefined)
    setSuccess(undefined)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(undefined)
    setSuccess(undefined)
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    const payload: Record<string, string | null> = {}
    for (const key of Object.keys(MAX) as (keyof ProfileValues)[]) {
      if (values[key].trim() !== initial[key].trim()) payload[key] = values[key].trim() || null
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSaveError(data?.error || 'Unable to update this profile.')
        return
      }
      setSuccess('Profile saved successfully.')
      router.refresh()
    } catch {
      setSaveError('Unable to update this profile.')
    } finally {
      setLoading(false)
    }
  }

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-white/10 bg-panel p-5 sm:p-6">
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    )
  }

  return (
    <form onSubmit={save} noValidate className="rounded-2xl border border-white/10 bg-panel p-5 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">Edit Profile</h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="admin-user-display-name">Display name</label>
          <input id="admin-user-display-name" type="text" value={values.display_name} onChange={setField('display_name')} className={inputClass(Boolean(errors.display_name))} placeholder="How the user is addressed" />
          <FieldError message={errors.display_name} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="admin-user-full-name">Full name</label>
          <input id="admin-user-full-name" type="text" value={values.full_name} onChange={setField('full_name')} className={inputClass(Boolean(errors.full_name))} placeholder="Full legal name" />
          <FieldError message={errors.full_name} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="admin-user-locale">Locale</label>
          <input id="admin-user-locale" type="text" value={values.locale} onChange={setField('locale')} className={inputClass(Boolean(errors.locale))} placeholder="en" />
          <FieldError message={errors.locale} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="admin-user-phone">Phone</label>
          <input id="admin-user-phone" type="tel" value={values.phone} onChange={setField('phone')} className={inputClass(Boolean(errors.phone))} placeholder="+880 1XXX-XXXXXX" />
          <FieldError message={errors.phone} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-300" htmlFor="admin-user-bio">Bio</label>
          <textarea id="admin-user-bio" rows={4} value={values.bio} onChange={setField('bio')} className={`${inputClass(Boolean(errors.bio))} min-h-[7rem] resize-y`} placeholder="Short introduction" />
          <p className="mt-2 text-right text-xs text-gray-500">{values.bio.length}/{MAX.bio}</p>
          <FieldError message={errors.bio} />
        </div>
      </div>

      {saveError && <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{saveError}</div>}
      {success && <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

      <div className="mt-6">
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Profile'}</Button>
      </div>
    </form>
  )
}