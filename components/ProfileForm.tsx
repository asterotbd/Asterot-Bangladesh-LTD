"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import createBrowserClient from '../lib/supabaseBrowser'
import Button from '../components/Button'

type FormValues = {
  full_name: string
  display_name: string
  phone: string
  locale: string
  bio: string
}

type Errors = Partial<Record<keyof FormValues, string>>

const MAX_PHONE = 30
const MAX_LOCALE = 16
const MAX_BIO = 500

const EMPTY: FormValues = {
  full_name: '',
  display_name: '',
  phone: '',
  locale: '',
  bio: ''
}

function validate(values: FormValues): Errors {
  const errors: Errors = {}
  if (values.phone.trim().length > MAX_PHONE) errors.phone = `Phone must be ${MAX_PHONE} characters or fewer.`
  if (values.locale.trim().length > MAX_LOCALE) errors.locale = `Locale must be ${MAX_LOCALE} characters or fewer.`
  if (values.bio.trim().length > MAX_BIO) errors.bio = `Bio must be ${MAX_BIO} characters or fewer.`
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

export default function ProfileForm({ userId, email, initial }: { userId: string, email: string, initial: FormValues }) {
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()

  useEffect(() => {
    setValues({ ...EMPTY, ...initial })
    setLoaded(true)
  }, [userId, initial])

  const setField = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
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
    const supabase = createBrowserClient()
    const payload: Partial<Record<keyof FormValues, string | null>> = {}
    if (values.full_name.trim() !== initial.full_name.trim()) payload.full_name = values.full_name.trim() || null
    if (values.display_name.trim() !== initial.display_name.trim()) payload.display_name = values.display_name.trim() || null
    if (values.phone.trim() !== initial.phone.trim()) payload.phone = values.phone.trim() || null
    if (values.locale.trim() !== initial.locale.trim()) payload.locale = values.locale.trim() || null
    if (values.bio.trim() !== initial.bio.trim()) payload.bio = values.bio.trim() || null

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    setLoading(false)
    if (updateError) {
      setSaveError(updateError.message)
      return
    }
    setSuccess('Profile saved successfully.')
  }

  if (!loaded) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-xl shadow-black/20">
        <p className="text-gray-400">Loading profile…</p>
      </div>
    )
  }

  return (
    <form onSubmit={save} noValidate className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-xl shadow-black/20">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300" htmlFor="profile-email">Email</label>
        <p id="profile-email" className="mt-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-400">
          {email}
        </p>
        <p className="mt-2 text-xs text-gray-500">Email cannot be changed here.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="profile-full-name">Full name</label>
          <input id="profile-full-name" type="text" autoComplete="name" value={values.full_name} onChange={setField('full_name')} className={inputClass(Boolean(errors.full_name))} placeholder="Your full name" />
          <FieldError message={errors.full_name} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="profile-display-name">Display name</label>
          <input id="profile-display-name" type="text" autoComplete="nickname" value={values.display_name} onChange={setField('display_name')} className={inputClass(Boolean(errors.display_name))} placeholder="How you&apos;d like to be addressed" />
          <FieldError message={errors.display_name} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="profile-phone">Phone</label>
          <input id="profile-phone" type="tel" autoComplete="tel" value={values.phone} onChange={setField('phone')} className={inputClass(Boolean(errors.phone))} placeholder="+880 1XXX-XXXXXX" />
          <FieldError message={errors.phone} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="profile-locale">Locale</label>
          <input id="profile-locale" type="text" value={values.locale} onChange={setField('locale')} className={inputClass(Boolean(errors.locale))} placeholder="en" />
          <FieldError message={errors.locale} />
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-300" htmlFor="profile-bio">Bio</label>
        <textarea id="profile-bio" rows={5} value={values.bio} onChange={setField('bio')} className={`${inputClass(Boolean(errors.bio))} min-h-[8rem] resize-y`} placeholder="A short introduction about yourself" />
        <p className="mt-2 text-right text-xs text-gray-500">{values.bio.length}/{MAX_BIO}</p>
        <FieldError message={errors.bio} />
      </div>

      {saveError && <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{saveError}</div>}

      {success && <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? 'Saving…' : 'Save Profile'}
        </Button>
        <Link href="/dashboard" className="btn btn-ghost w-full sm:w-auto">
          Dashboard
        </Link>
      </div>
    </form>
  )
}
