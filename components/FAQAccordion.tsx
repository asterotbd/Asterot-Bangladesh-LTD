'use client'

import { useState } from 'react'
import { faqItems, type FAQItem } from '../lib/faq'

type FAQAccordionProps = {
  items?: FAQItem[]
}

export default function FAQAccordion({ items = faqItems }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(current => (current === index ? null : index))
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const buttonId = `faq-question-${index}`
        const panelId = `faq-answer-${index}`
        return (
          <div key={item.question} className="rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
            <h2>
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
            </h2>
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
  )
}
