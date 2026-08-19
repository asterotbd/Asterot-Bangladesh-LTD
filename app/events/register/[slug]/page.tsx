import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import createServerClient from '../../../../lib/supabaseServer'
import { getPublishedEventBySlug } from '../../../../lib/events-server'
import EventRegisterForm from '../../../../components/EventRegisterForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Event Registration',
  description: 'Register for an Asterot event.',
  alternates: {
    canonical: 'https://www.asterot.com/events/register'
  }
}

export default async function EventRegisterPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Encode the full path so a slug containing `?`, `&`, `#` or control
    // characters cannot inject additional query parameters into the `next` value.
    const nextPath = `/events/register/${slug}`
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  const event = await getPublishedEventBySlug(slug)

  if (!event) {
    return (
      <main className="bg-black text-white">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
          <div className="ambient-layer">
            <div className="ambient-glow" />
            <div className="ambient-dots" />
          </div>
          <div className="mx-auto max-w-[min(48rem,100%)] px-[clamp(1rem,2vw,1.5rem)]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Registration unavailable</h1>
              <p className="mt-4 text-gray-300 leading-7">
                Online registration is not open for this event. Check the event page for details, or
                contact the Asterot team for more information.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/events" className="btn btn-primary">Back to events</Link>
                <Link href="/account" className="btn btn-ghost">My account</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <div className="mx-auto max-w-[min(48rem,100%)] px-[clamp(1rem,2vw,1.5rem)]">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Event registration</span>
          <h1 className="fluid-title mt-6 font-black leading-tight tracking-tight">Register</h1>
          <EventRegisterForm event={{ id: event.id, slug: event.slug, title_en: event.title_en, date: event.date, location: event.location }} />
        </div>
      </section>
    </main>
  )
}
