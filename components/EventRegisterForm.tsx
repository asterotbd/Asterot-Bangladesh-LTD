"use client"
import { useState } from 'react'
import Link from 'next/link'
import Button from './Button'

type EventSummary = {
  id: string
  slug: string
  title_en: string
  date?: string | null
  location?: string | null
}

export default function EventRegisterForm({ event }: { event: EventSummary }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: event.slug, notes })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        setLoading(false)
        return
      }
      setDone(true)
      setLoading(false)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
        <h2 className="text-xl font-semibold text-primary">Registration confirmed</h2>
        <p className="mt-4 text-gray-300 leading-7">
          Thanks for registering for <span className="font-semibold text-white">{event.title_en}</span>.
          Your registration is pending confirmation and will appear in your dashboard shortly.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/dashboard" className="btn btn-primary">View dashboard</Link>
          <Link href="/events" className="btn btn-ghost">Back to events</Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-xl font-semibold tracking-tight">{event.title_en}</h2>
        {event.date && <p className="mt-2 text-sm text-gray-400">Date: {event.date}</p>}
        {event.location && <p className="mt-1 text-sm text-gray-400">Location: {event.location}</p>}
      </div>

      <label className="mt-6 block text-sm font-medium text-gray-300" htmlFor="register-notes">
        Notes (optional)
        <textarea
          id="register-notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          placeholder="Anything the organisers should know (dietary, accessibility, questions)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </label>

      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <Button type="submit" className="mt-6 w-full" disabled={loading}>
        {loading ? 'Registering...' : 'Confirm registration'}
      </Button>
      <p className="mt-3 text-center text-xs text-gray-500">
        Your registration is tied to your signed-in account.
      </p>
    </form>
  )
}
