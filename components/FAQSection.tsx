'use client'

import { useState } from 'react'
import { faqItems, type FAQItem } from '../lib/faq'

type FAQSectionProps = {
  items?: FAQItem[]
}

export default function FAQSection({ items = faqItems }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(current => (current === index ? null : index))
  }

  return (
    <section className="pb-16 sm:pb-20" aria-labelledby="faq-title">
      <div className="mx-auto max-w-[min(70ch,100%)] text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-primary">Frequently asked questions</p>
        <h2 id="faq-title" className="mt-4 text-3xl font-semibold">Questions clients often ask</h2>
        <p className="mt-4 text-gray-300">Everything you need to know about working with Asterot before you get in touch.</p>
      </div>

      <div className="mx-auto mt-10 max-w-[min(46rem,100%)] space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index
          const buttonId = `faq-question-${index}`
          const panelId = `faq-answer-${index}`
          return (
            <div key={item.question} className="rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 rounded-[2rem] px-6 py-5 text-left sm:px-7"
                >
                  <span className="text-base font-semibold tracking-tight sm:text-lg">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-xl leading-none text-primary transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                  >+</span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-base leading-7 text-gray-300 sm:px-7 sm:pb-7">{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mx-auto mt-12 max-w-[min(46rem,100%)] rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20 sm:p-10">
        <h3 className="text-2xl font-semibold">Have an event in mind?</h3>
        <p className="mx-auto mt-3 max-w-[min(52ch,100%)] text-gray-300">{"Tell us what you're planning, and let's build an experience around it."}</p>
        <div className="mt-7">
          <a href="/contact" className="btn btn-primary">Plan Your Event</a>
        </div>
      </div>
    </section>
  )
}
