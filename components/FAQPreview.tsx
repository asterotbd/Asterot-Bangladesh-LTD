import Link from 'next/link'

export default function FAQPreview() {
  return (
    <section className="pb-16 sm:pb-20" aria-labelledby="faq-preview-title">
      <div className="mx-auto max-w-[min(70ch,100%)] text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-primary">Frequently asked questions</p>
        <h2 id="faq-preview-title" className="mt-4 text-3xl font-semibold">Questions clients often ask</h2>
        <p className="mt-4 text-gray-300">Everything you need to know about working with Asterot before you get in touch.</p>
        <div className="mt-8">
          <Link href="/faq" className="btn btn-primary">View All FAQs</Link>
        </div>
      </div>
    </section>
  )
}
