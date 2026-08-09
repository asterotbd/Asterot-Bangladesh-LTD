import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Event Documentation',
  description: 'Photos and videos from Asterot Bangladesh Limited events and programs.',
  alternates: {
    canonical: 'https://www.asterot.com/events/documentation'
  }
}

export default function EventDocumentationLayout({ children }: { children: React.ReactNode }) {
  return children
}
