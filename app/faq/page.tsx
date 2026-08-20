import type { Metadata } from 'next'
import Container from '../../components/Container'
import FAQAccordion from '../../components/FAQAccordion'
import { faqItems } from '../../lib/faq'
import { getPublishedFaq } from '../../lib/faq-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: "Find answers to common questions about Asterot's event planning, production, corporate events, sports events, brand activations and event services.",
  alternates: {
    canonical: 'https://www.asterot.com/faq'
  }
}

export default async function FAQPage() {
  let dbItems: Awaited<ReturnType<typeof getPublishedFaq>> = []
  try {
    dbItems = await getPublishedFaq()
  } catch (err) {
    console.error('FAQ page load error', err)
  }

  const items = dbItems.length > 0
    ? dbItems.map((item) => ({
        question: item.question_en || item.question_bn || '',
        answer: item.answer_en || item.answer_bn || ''
      }))
    : faqItems

  // Structured data must reflect the FAQ items actually rendered, so search
  // engines never index questions that are not published on the page.
  const faqPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  }

  return (
    <main className="bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Frequently asked questions</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Questions clients often ask</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Everything you need to know about working with Asterot before you get in touch.</p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="mx-auto max-w-[min(46rem,100%)] py-16 sm:py-20">
          <FAQAccordion items={items} />
        </div>
      </Container>

      {/* CTA */}
      <Container>
        <div className="mx-auto mb-8 max-w-[min(46rem,100%)] rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20 sm:mb-12 sm:p-10">
          <h2 className="text-2xl font-semibold">Have an event in mind?</h2>
          <p className="mx-auto mt-3 max-w-[min(52ch,100%)] text-gray-300">{"Tell us what you're planning, and let's build an experience around it."}</p>
          <div className="mt-7">
            <a href="/contact" className="btn btn-primary">Plan Your Event</a>
          </div>
        </div>
      </Container>
    </main>
  )
}