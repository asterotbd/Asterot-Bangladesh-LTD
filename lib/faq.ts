export type FAQItem = {
  question: string
  answer: string
}

export const faqItems: FAQItem[] = [
  {
    question: 'What types of events does Asterot organize?',
    answer: 'Asterot delivers a range of event experiences, including corporate events, sports tournaments, conferences, celebrations, brand activations, entertainment events, and other customized experiences.'
  },
  {
    question: 'Does Asterot handle the complete event from planning to execution?',
    answer: 'Yes. Asterot can support the event journey from concept and planning through coordination, production, execution, and post-event activities, depending on the requirements of each project.'
  },
  {
    question: 'Does Asterot organize events outside Dhaka?',
    answer: 'Asterot is focused on delivering event experiences across Bangladesh. The scope and logistics for each project are discussed based on the event\u2019s location, requirements, and scale.'
  },
  {
    question: 'Can Asterot work with our existing vendors and partners?',
    answer: 'Yes. Where appropriate, Asterot can coordinate with a client\u2019s existing vendors, suppliers, agencies, venues, or other partners as part of the overall event execution.'
  },
  {
    question: 'How early should we contact Asterot before an event?',
    answer: 'It is best to contact Asterot as early as possible so there is enough time to understand the requirements, develop the concept, coordinate resources, and plan the execution properly. The ideal timeline depends on the type and scale of the event.'
  },
  {
    question: 'Can Asterot work within a specific budget?',
    answer: 'Yes. Event concepts and execution plans can be developed according to the client\u2019s requirements and available budget. The final scope and cost depend on factors such as event type, scale, location, production requirements, and other project-specific needs.'
  },
  {
    question: 'Does Asterot provide event design, branding and production?',
    answer: 'Asterot can support event concepts, visual experiences, branding, production, coordination, and execution depending on the requirements of the project.'
  },
  {
    question: 'Does Asterot handle corporate events and conferences?',
    answer: 'Yes. Asterot provides event solutions for corporate experiences, conferences, celebrations, meetings, launches, employee events, and other business-focused occasions.'
  },
  {
    question: 'Does Asterot organize sports tournaments and competitions?',
    answer: 'Yes. Sports events and tournaments are among Asterot\u2019s event capabilities, including planning, coordination, branding, production, and event-day execution according to project requirements.'
  },
  {
    question: 'Can Asterot handle both small and large events?',
    answer: 'Asterot works with different types and scales of events. The appropriate approach depends on the event\u2019s objectives, audience, location, timeline, and production requirements.'
  },
  {
    question: 'How does the event planning process work?',
    answer: 'The process generally begins with understanding the client\u2019s objectives and requirements. Asterot then develops an appropriate concept and execution plan, coordinates the required resources, and manages the event through execution and completion.'
  },
  {
    question: 'How can I request a proposal from Asterot?',
    answer: 'You can contact Asterot through the website\u2019s contact channels and share your event requirements. The team can then discuss your project and determine the appropriate next steps.'
  }
]

export const faqPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
}
