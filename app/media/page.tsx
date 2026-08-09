import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import MediaTrailer from '../../components/MediaTrailer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media',
  description: 'Photos and videos from Asterot Bangladesh Limited events — tournaments, corporate programs, celebrations and live experiences.',
  alternates: {
    canonical: 'https://www.asterot.com/media'
  }
}

export default function MediaPage() {
  return (
    <main className="bg-black text-white">
      <MediaTrailer />

      {/* Explore sections */}
      <section className="py-16 sm:py-24">
        <Container>
          <RevealSection>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Media</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Explore</h2>
              <p className="mt-4 text-gray-300">
                Dive into our photos and videos from events, projects, and behind-the-scenes moments.
              </p>
            </div>
          </RevealSection>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <RevealSection className="h-full">
              <Link
                href="/media/photos"
                className="group card-surface flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 sm:p-10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-7 w-7 text-primary">
                    <path d="M4 8h2l1.5-2.5h9L18 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">Photos</h3>
                <p className="mt-3 flex-1 text-gray-400">
                  Gallery of our projects, people, and moments — organized into albums for every occasion.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:text-accent">
                  Browse Photos
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </RevealSection>

            <RevealSection className="h-full">
              <Link
                href="/media/videos"
                className="group card-surface flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 sm:p-10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-7 w-7 text-primary">
                    <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.56-6.86a1.04 1.04 0 0 0 0-1.76L9.56 4.26A1.04 1.04 0 0 0 8 5.14Z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">Videos</h3>
                <p className="mt-3 flex-1 text-gray-400">
                  Our latest projects, stories, events, and behind-the-scenes moments. Filter by category and switch between grid and list views.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:text-accent">
                  Browse Videos
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </RevealSection>
          </div>
        </Container>
      </section>
    </main>
  )
}
