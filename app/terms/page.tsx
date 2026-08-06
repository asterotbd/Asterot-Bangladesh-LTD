import Link from 'next/link'
import Container from '../../components/Container'

type Section = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

const sections: Section[] = [
  {
    title: '1. About Asterot',
    paragraphs: [
      'Asterot Bangladesh Limited is a company registered in Bangladesh and currently provides event management and related services.',
      'Our website may provide information about the company, upcoming events, registration opportunities, forms, and other services. As our business develops, additional products or services may be introduced; these Terms apply to them where applicable, subject to any additional terms provided at the time of purchase.'
    ]
  },
  {
    title: '2. Eligibility',
    paragraphs: ['You must provide accurate information when using our Services. If you create an account, you are responsible for:'],
    items: ['Providing accurate and complete information', 'Maintaining the confidentiality of your login credentials', 'Keeping your account information up to date', 'All activities conducted through your account', 'Immediately notifying us if you believe your account has been accessed or used without authorization']
  },
  {
    title: '3. Use of the Website',
    paragraphs: ['You agree to use the website and Services only for lawful purposes. You must not:'],
    items: ['Violate any applicable law or regulation', 'Attempt to gain unauthorized access to our systems or accounts', 'Interfere with the operation or security of the website', 'Introduce malicious software, viruses, or harmful material', 'Use automated methods to improperly access or collect website information', 'Impersonate another person or organization', 'Submit fraudulent, misleading, or unlawful information', 'Abuse event registration or payment systems', 'Attempt to circumvent applicable restrictions, fees, or cancellation policies', 'Use our Services in a manner that may harm Asterot, users, participants, partners, or third parties']
  },
  {
    title: '4. Event Registration',
    paragraphs: ['Event registration may require your name, email address, phone number, address, and other event-related information. You are responsible for ensuring submitted information is accurate.', 'Registration may be subject to event-specific rules, eligibility requirements, deadlines, fees, capacity limitations, or instructions. Registration does not necessarily guarantee participation where capacity is limited or verification is required.', 'Asterot may cancel or refuse a registration for materially false information, violation of event rules, inappropriate, disruptive, fraudulent, or unlawful conduct, unsatisfied payment requirements, or legitimate operational, safety, legal, or organizational reasons.']
  },
  {
    title: '5. Services and Purchases',
    paragraphs: ['Asterot provides event management and related services. Before purchasing a service, you may receive information about its scope, fees, deadlines, deliverables, and relevant conditions. You agree to provide the information and cooperation reasonably necessary to provide the purchased service.', 'We may refuse or cancel an order or service arrangement for a legitimate reason, including fraud, inaccurate information, non-payment, violation of applicable rules, or circumstances beyond our reasonable control. Future physical or digital products may have additional product-specific terms.']
  },
  {
    title: '6. Payments',
    paragraphs: ['Payments may be made through methods made available by Asterot, including:'],
    items: ['bKash', 'Nagad', 'Rocket', 'Bank transfer', 'Other payment methods we may introduce in the future']
  },
  {
    title: '7. Refund and Cancellation Policy',
    paragraphs: ['Unless different terms are expressly provided for a particular service or event, a refund may be requested within 15 days of the applicable payment or transaction. After that deadline, a refund may not be available.', 'Approved refund timing and method may depend on the original payment method, the payment provider, banking procedures, and verification requirements. Event- or service-specific cancellation and refund conditions communicated before purchase or registration apply to that transaction.']
  },
  {
    title: '8. Forms and User Submissions',
    paragraphs: ['You are responsible for ensuring that information and materials submitted through forms, registrations, applications, documents, photographs, or other materials are accurate, lawful, and appropriate. You must not submit material you lack the right to provide, that violates another person’s rights, is fraudulent, unlawful, harmful, or contains malicious software.', 'You grant Asterot permission to use submitted information and materials as reasonably necessary to provide requested Services, administer events, communicate with you, process registrations, comply with legal obligations, and operate our business.']
  },
  {
    title: '9. Personal Information and Privacy',
    paragraphs: ['We may collect information needed to operate our website and provide Services, including name, email address, phone number, address, registration and account information, documents, photographs, and uploaded materials.', 'We use personal information to manage accounts and registrations, provide Services, process payments, communicate with users, administer events, maintain security, prevent fraud, improve Services, and meet legal obligations. Please also read our Privacy Policy.']
  },
  {
    title: '10. Intellectual Property',
    paragraphs: ['Unless otherwise stated, website content—including text, graphics, logos, branding, photographs, videos, designs, software, and other materials—is owned by or licensed to Asterot Bangladesh Limited and protected by applicable intellectual property laws.', 'You may use the website for legitimate personal or business purposes consistent with these Terms. You may not copy substantial website content, redistribute materials commercially, create derivative works, misuse our trademarks, scrape website content, or represent our materials as your own without appropriate authorization.']
  },
  {
    title: '11. Third-Party Services and Links',
    paragraphs: ['Our website may link to or integrate with third-party services, including payment providers and external websites. Those services are governed by their own terms and policies. Asterot does not control and is not responsible for their content, availability, security, privacy practices, or policies.']
  },
  {
    title: '12. Availability of Services',
    paragraphs: ['We aim to keep our website and Services reliable, but do not guarantee uninterrupted, error-free, or continuous availability. Services may be unavailable because of maintenance, technical problems, security incidents, network or infrastructure failures, third-party interruptions, events beyond our reasonable control, or other operational circumstances. We may modify, suspend, or discontinue any part of the website or Services where reasonably necessary.']
  },
  {
    title: '13. Disclaimers',
    paragraphs: ['We make reasonable efforts to keep website information accurate and useful, but it may contain errors, omissions, or become outdated. Unless expressly stated otherwise, the website and general information are provided on an “as available” basis.', 'We do not guarantee continuous availability, complete or current information, freedom from technical errors, availability of every Service, or compatibility with every device, browser, or technical environment.']
  },
  {
    title: '14. Limitation of Liability',
    paragraphs: ['To the extent permitted by applicable law, Asterot Bangladesh Limited is not responsible for indirect, incidental, special, consequential, or unforeseeable losses arising from use of the website or Services, including losses from temporary unavailability, third-party payment failures, technical failures, inaccurate user information, or events beyond our reasonable control.', 'Nothing in these Terms excludes or limits liability where doing so would be prohibited by applicable law.']
  },
  {
    title: '15. Indemnification',
    paragraphs: ['To the extent permitted by applicable law, you are responsible for losses, claims, liabilities, costs, and reasonable expenses arising from your violation of these Terms or applicable law, misuse of the website or Services, fraudulent or unauthorized activity, or infringement of another person’s rights.']
  },
  {
    title: '16. Suspension and Termination',
    paragraphs: ['We may suspend or terminate your account or access to Services where reasonably necessary, including for material violations of these Terms, fraudulent or misleading information, unlawful or abusive conduct, interference with security or operations, unsatisfied payment obligations, or legal, security, or operational reasons. Termination does not automatically eliminate obligations or rights that arose before termination.']
  },
  {
    title: '17. Changes to These Terms',
    paragraphs: ['We may update these Terms to reflect changes to Services, business practices, legal requirements, or website functionality. When changes are material, we may update the Last Updated date and provide additional notice where appropriate. Continued use after revised Terms take effect constitutes acceptance to the extent permitted by law.']
  },
  {
    title: '18. Governing Law',
    paragraphs: ['These Terms are governed by and interpreted under the laws of Bangladesh. Disputes relating to these Terms or our Services are subject to the jurisdiction of the appropriate courts of Bangladesh, unless applicable law requires otherwise.']
  },
  {
    title: '19. Severability',
    paragraphs: ['If any provision is invalid, unlawful, or unenforceable, it shall be interpreted or modified as necessary to make it enforceable where legally permitted. The remaining provisions continue in full force and effect.']
  },
  {
    title: '20. Entire Agreement',
    paragraphs: ['These Terms, together with applicable event-specific terms, service agreements, payment terms, refund policies, and the Privacy Policy, form the agreement governing your use of the website and Services, except where a separate written agreement expressly applies.']
  }
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.10),_transparent_28%),linear-gradient(180deg,#050507_0%,#09090f_100%)] pt-28 text-white">
      <Container>
        <article className="mx-auto max-w-4xl py-10 sm:py-16">
          <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-white">← Back to home</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.22em] text-primary">Asterot Bangladesh Limited</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="mt-6 text-sm leading-7 text-gray-400">Effective Date: 06 August, 2026 · Last Updated: 06 August, 2026</p>

          <div className="mt-10 space-y-5 text-base leading-8 text-gray-300">
            <p>Welcome to the website of Asterot Bangladesh Limited (“Asterot,” “we,” “us,” or “our”). These Terms of Service govern your access to and use of our website, services, event registration facilities, forms, accounts, and other services made available through our website (collectively, the “Services”).</p>
            <p>By accessing or using our website or Services, creating an account, registering for an event, submitting information, or purchasing a service, you acknowledge that you have read, understood, and agree to these Terms. If you do not agree, please do not use our website or Services.</p>
          </div>

          <div className="mt-14 space-y-12">
            {sections.map(section => (
              <section key={section.title} className="border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                <div className="mt-4 space-y-4 text-gray-300 leading-8">
                  {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  {section.items && <ul className="list-disc space-y-2 pl-5 marker:text-primary">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
                </div>
              </section>
            ))}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-2xl font-semibold text-white">21. Contact Us</h2>
              <div className="mt-4 space-y-2 text-gray-300 leading-8">
                <p>If you have questions about these Terms, Services, payments, cancellations, or other website matters, please contact Asterot Bangladesh Limited.</p>
                <p>Country: Bangladesh<br />Website: www.asterot.com<br />Email: <a className="text-white underline decoration-primary underline-offset-4" href="mailto:asterotbd@gmail.com">asterotbd@gmail.com</a><br />Phone: <a className="text-white underline decoration-primary underline-offset-4" href="tel:+8801325274642">+880 1325 274642</a><br />Registered/Business Address: 5B/5 Razia Sultana Road, Mohammadpur, Dhaka, Bangladesh</p>
              </div>
            </section>
          </div>
        </article>
      </Container>
    </main>
  )
}
