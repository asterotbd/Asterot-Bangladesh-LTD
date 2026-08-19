export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../lib/supabaseServer'
import { getUserRoles } from '../../lib/auth'

function displayName(profile: { full_name: string | null, display_name: string | null }, email: string) {
  return profile?.display_name || profile?.full_name || email
}

function formatDate(value: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, phone, locale')
    .eq('id', user.id)
    .maybeSingle()

  let roles: string[] = []
  try {
    roles = await getUserRoles(user.id)
  } catch {
    roles = []
  }

  const { data: registrations } = await supabase
    .from('registrations')
    .select('id, status, created_at, events(id, title_en, slug, date, location)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const emailConfirmed = Boolean(user.email_confirmed_at)
  const name = displayName(profile as any, user.email || 'Member')

  return (
    <main className="container py-16 sm:py-20">
      {/* Header */}
      <header className="mb-10">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-primary">
          Member Portal
        </span>
        <h1 className="fluid-title font-black tracking-tight mt-4">
          Welcome, {name}
        </h1>
        <p className="mt-3 max-w-[min(60ch,100%)] text-gray-300">
          {user.email}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-gray-400">Name</dt>
              <dd className="mt-1 text-white">{profile?.display_name || profile?.full_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="mt-1 text-white">{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Phone</dt>
              <dd className="mt-1 text-white">{profile?.phone || '—'}</dd>
            </div>
          </dl>
          <Link href="/account/profile" className="btn btn-ghost mt-6">
            Edit Profile
          </Link>
        </section>

        {/* Account */}
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold tracking-tight">Account</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-gray-400">Status</dt>
              <dd className="mt-1">
                {emailConfirmed ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                    Pending verification
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Role(s)</dt>
              <dd className="mt-1 text-white">
                {roles.length > 0 ? roles.join(', ') : 'Member'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* My Events */}
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold tracking-tight">My Events</h2>
          <div className="mt-5">
            {registrations && registrations.length > 0 ? (
              <ul className="divide-y divide-white/10">
                {registrations.map((r: any) => (
                  <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{r.events?.title_en || 'Event'}</p>
                        <p className="mt-1 text-sm text-gray-400">
                          {formatDate(r.events?.date || r.created_at)}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 uppercase tracking-wide">
                        {r.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">You haven&apos;t registered for any events yet.</p>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/account/profile" className="btn btn-primary">
              Edit Profile
            </Link>
            <Link href="/events" className="btn btn-ghost">
              Browse Events
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Contact Asterot
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
