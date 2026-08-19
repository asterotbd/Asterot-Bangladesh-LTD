export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../lib/supabaseServer'
import ProfileForm from '../../../components/ProfileForm'

export default async function EditProfilePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userId = user.id
  const email = user.email || ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, phone, locale, bio')
    .eq('id', userId)
    .maybeSingle()

  const initial = {
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    phone: profile?.phone || '',
    locale: profile?.locale || '',
    bio: profile?.bio || ''
  }

  return (
    <main className="container py-16 sm:py-20">
      <header className="mb-10">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-primary">
          Member Portal
        </span>
        <h1 className="fluid-title font-black tracking-tight mt-4">Edit Profile</h1>
        <p className="mt-3 max-w-[min(60ch,100%)] text-gray-300">
          Keep your Asterot member details up to date.
        </p>
      </header>

      <ProfileForm userId={userId} email={email} initial={initial} />

      <p className="mt-8">
        <Link href="/dashboard" className="text-primary font-medium hover:underline">
          ← Back to Dashboard
        </Link>
      </p>
    </main>
  )
}
