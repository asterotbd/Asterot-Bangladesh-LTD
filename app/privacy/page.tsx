import Link from 'next/link'
import Container from '../../components/Container'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for the Asterot Bangladesh Limited website.',
  alternates: {
    canonical: 'https://www.asterot.com/privacy'
  }
}

type Section = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

const sections: Section[] = [
  {
    title: '1. Purpose and Scope',
    paragraphs: [
      'This Employee Handbook and Company Policy ("Policy") establishes the standards, expectations, workplace practices, and procedures applicable to employees of Asterot Bangladesh Limited ("Asterot," "the Company," "we," or "our").',
      'The purpose of this Policy is to promote:'
    ],
    items: [
      'Professionalism and integrity',
      'A respectful and inclusive workplace',
      'Employee accountability',
      'Workplace health and safety',
      'Effective communication and teamwork',
      'Responsible use of Company resources',
      'Consistent performance and development',
      'A positive and productive working environment'
    ],
  },
  {
    title: '1. Purpose and Scope',
    paragraphs: [
      'This Policy applies to employees of Asterot Bangladesh Limited. Certain provisions may also apply to interns, volunteers, temporary staff, contractors, or event personnel where specifically communicated or contractually applicable.',
      'This Policy is intended to operate consistently with applicable laws and regulations of Bangladesh. Where applicable law provides a different mandatory requirement, the applicable law shall prevail.'
    ]
  },
  {
    title: '2. Professional Standards and Code of Conduct',
    paragraphs: ['All employees are expected to conduct themselves professionally and responsibly while representing Asterot. Employees are expected to:'],
    items: [
      'Act honestly, ethically, and professionally',
      'Treat colleagues, clients, partners, vendors, participants, and members of the public with respect',
      'Communicate professionally and responsibly',
      'Follow reasonable and lawful instructions from authorized supervisors and management',
      'Protect Company property and confidential information',
      'Maintain appropriate professional boundaries',
      'Avoid conduct that may damage the Company’s reputation',
      'Comply with applicable Company policies and procedures'
    ]
  },
  {
    title: '2. Professional Standards and Code of Conduct',
    paragraphs: ['Employees must not engage in fraud, dishonesty, intimidation, harassment, discrimination, violence, serious misconduct, or other unlawful or unethical behavior.']
  },
  {
    title: '3. Confidentiality and Protection of Company Information',
    paragraphs: ['Employees may have access to confidential or proprietary information belonging to Asterot, its clients, partners, employees, vendors, or other parties. Confidential information may include:'],
    items: [
      'Business plans',
      'Financial information',
      'Client information',
      'Event plans and operational information',
      'Internal communications',
      'Passwords and system credentials',
      'Contracts and commercial information',
      'Employee information',
      'Marketing strategies',
      'Unpublished projects',
      'Other information identified as confidential or reasonably understood to be confidential'
    ]
  },
  {
    title: '3. Confidentiality and Protection of Company Information',
    paragraphs: [
      'Employees must not disclose, copy, misuse, or distribute confidential information without appropriate authorization.',
      'Confidentiality obligations may continue after an employee leaves the Company where applicable.',
      'Employees must immediately report suspected loss, unauthorized disclosure, or unauthorized access to confidential information to management or the designated responsible person.'
    ]
  },
  {
    title: '4. Conflict of Interest',
    paragraphs: ['Employees must avoid situations in which their personal interests conflict, or appear to conflict, with the interests of Asterot. Employees must disclose potential or actual conflicts of interest to management as soon as reasonably possible. Examples may include:'],
    items: [
      'Personal financial interests involving Company vendors or clients',
      'Outside activities that interfere with Company responsibilities',
      'Accepting inappropriate benefits or advantages from suppliers or clients',
      'Using Company information for personal gain',
      'Participating in business decisions involving a close personal interest'
    ]
  },
  {
    title: '4. Conflict of Interest',
    paragraphs: ['The Company will review disclosed conflicts and determine appropriate measures where necessary.']
  },
  {
    title: '5. Working Hours and Attendance',
    paragraphs: [
      'The Company’s standard office hours are: 10:00 AM to 6:00 PM, Sunday through Thursday.',
      'Friday and Saturday are generally designated as weekly days off, subject to operational requirements, special events, client commitments, or other legitimate business needs.',
      'Employees assigned to events or special operations may be required to work outside standard office hours.',
      'Where additional working hours or event assignments are required, the Company will manage such arrangements in accordance with applicable law and Company procedures.',
      'Employees are expected to:'
    ],
    items: [
      'Arrive on time',
      'Maintain regular attendance',
      'Notify their supervisor promptly if they expect to be late or absent',
      'Obtain appropriate approval for planned absences',
      'Follow event-specific attendance requirements'
    ]
  },
  {
    title: '5. Working Hours and Attendance',
    paragraphs: [
      'Arrival after 10:15 AM should ordinarily be communicated to and justified to the employee’s supervisor.',
      'Repeated unauthorized absence, lateness, or attendance issues may result in appropriate corrective or disciplinary action in accordance with Company policy and applicable law.'
    ]
  },
  {
    title: '6. Dress and Professional Appearance',
    paragraphs: ['Employees are expected to maintain a clean, professional, and appropriate appearance suitable for their role and responsibilities.', 'Regular Office Work', 'Smart-casual attire is generally appropriate unless a different standard is communicated.', 'Events and Client Meetings', 'Formal, professional, or Company-branded attire may be required depending on the nature of the event, client meeting, or assignment.', 'Event Operations', 'Employees assigned to fieldwork or event operations may be required to wear:'],
    items: [
      'Company-branded clothing',
      'Identification badges',
      'Designated uniforms',
      'Other safety or identification equipment'
    ]
  },
  {
    title: '6. Dress and Professional Appearance',
    paragraphs: ['Specific dress requirements will be communicated before relevant assignments.']
  },
  {
    title: '7. Leave and Time-Off',
    paragraphs: ['Asterot recognizes the importance of appropriate rest, personal time, and employee wellbeing. The Company’s internal leave structure currently provides:'],
    items: [
      'Annual Leave: 18 working days per year',
      'Sick Leave: 10 working days per year',
      'Casual Leave: 7 working days per year'
    ]
  },
  {
    title: '7. Leave and Time-Off',
    paragraphs: [
      'These entitlements are subject to applicable law, employment contracts, Company procedures, and any applicable statutory requirements.',
      'Employees should normally submit planned leave requests at least 3 days in advance and obtain approval from their immediate supervisor.',
      'Emergency or unexpected leave should be communicated as soon as reasonably possible.',
      'For sickness-related absence extending beyond the Company’s applicable threshold, the Company may request reasonable supporting documentation, such as a medical certificate, where permitted by applicable law.',
      'The Company may review and update leave entitlements and procedures to ensure compliance with applicable legal requirements.'
    ]
  },
  {
    title: '8. Event Operations and Event Protocol',
    paragraphs: ['Because Asterot provides event management services, employees assigned to events are expected to follow enhanced operational, safety, and professional standards. All assigned event personnel must:'],
    items: [
      'Attend required pre-event briefings',
      'Understand their assigned responsibilities',
      'Follow the established chain of command',
      'Wear required identification or uniforms',
      'Follow venue and event safety procedures',
      'Treat guests, clients, vendors, participants, and colleagues professionally',
      'Report safety or security concerns immediately',
      'Protect Company and client property',
      'Follow reasonable instructions from authorized event supervisors'
    ]
  },
  {
    title: '8. Event Operations and Event Protocol',
    paragraphs: [
      'Smoking, alcohol misuse, illegal drug use, or being under the influence of intoxicating substances while performing Company duties or representing Asterot at an event is prohibited, subject to applicable law and Company policy.',
      'Employees must not engage in behavior that compromises participant safety, event operations, or the Company’s reputation.'
    ]
  },
  {
    title: '9. Workplace Health and Safety',
    paragraphs: ['Asterot is committed to maintaining a safe and responsible working environment. Employees must:'],
    items: [
      'Follow applicable health and safety procedures',
      'Use required safety equipment',
      'Report hazards, accidents, injuries, or unsafe conditions promptly',
      'Follow venue-specific safety instructions during events',
      'Avoid reckless or dangerous conduct',
      'Cooperate with reasonable safety procedures and emergency instructions'
    ]
  },
  {
    title: '9. Workplace Health and Safety',
    paragraphs: [
      'Employees should never knowingly place themselves, colleagues, clients, event participants, or members of the public at unnecessary risk.',
      'The Company may implement additional safety procedures depending on the nature and location of an event or assignment.'
    ]
  },
  {
    title: '10. Anti-Harassment, Anti-Discrimination and Respectful Workplace',
    paragraphs: ['Asterot is committed to maintaining a workplace free from harassment, discrimination, intimidation, and abusive conduct. The Company does not tolerate:'],
    items: [
      'Verbal harassment',
      'Physical harassment or violence',
      'Sexual harassment',
      'Bullying or intimidation',
      'Discriminatory conduct',
      'Threats or abusive behavior',
      'Unwelcome conduct that creates a hostile or unsafe working environment',
      'Retaliation against a person who raises a genuine workplace concern'
    ]
  },
  {
    title: '10. Anti-Harassment, Anti-Discrimination and Respectful Workplace',
    paragraphs: [
      'Employees are expected to treat others with dignity and respect regardless of characteristics protected by applicable law.',
      'Concerns or complaints may be reported to management, HR, or another designated Company representative.',
      'The Company will seek to handle complaints appropriately, fairly, and as confidentially as reasonably possible.',
      'Where a complaint is made, the Company may conduct an appropriate review or investigation and take action where warranted.'
    ]
  },
  {
    title: '11. Reporting Concerns and Complaints',
    paragraphs: ['Employees are encouraged to raise workplace concerns promptly rather than allowing problems to escalate. Concerns may include:'],
    items: [
      'Harassment or discrimination',
      'Workplace safety',
      'Fraud or misconduct',
      'Conflicts of interest',
      'Confidentiality breaches',
      'Abuse of Company resources',
      'Unethical conduct',
      'Other serious workplace concerns'
    ]
  },
  {
    title: '11. Reporting Concerns and Complaints',
    paragraphs: [
      'Employees should normally report concerns to their immediate supervisor, HR, or designated management representative.',
      'Where the concern involves the employee’s immediate supervisor, the employee may report it to another appropriate member of management.',
      'A person who raises a genuine concern in good faith should not be subjected to retaliation for making that report.'
    ]
  },
  {
    title: '12. Use of Company Property and Resources',
    paragraphs: ['Company resources must be used responsibly and primarily for legitimate business purposes. Company resources may include:'],
    items: [
      'Laptops and computers',
      'Mobile phones',
      'Software and subscriptions',
      'Email accounts',
      'Internet access',
      'Identification cards',
      'Documents',
      'Event equipment',
      'Vehicles or other operational resources',
      'Other Company property'
    ]
  },
  {
    title: '12. Use of Company Property and Resources',
    paragraphs: ['Employees must:'],
    items: [
      'Protect Company property from loss, theft, or unauthorized use',
      'Use Company systems responsibly',
      'Maintain appropriate security practices',
      'Protect passwords and access credentials',
      'Return Company property when requested or when employment ends'
    ]
  },
  {
    title: '12. Use of Company Property and Resources',
    paragraphs: [
      'Unauthorized use, intentional damage, theft, misuse, or negligent handling of Company property may result in corrective or disciplinary action, subject to applicable law.',
      'Any deduction from wages or other financial consequence will only be made where legally permissible and in accordance with applicable law and Company procedures.'
    ]
  },
  {
    title: '13. Email, Internet and Technology Use',
    paragraphs: ['Company technology and communication systems are provided primarily for legitimate business purposes. Employees must not use Company systems to:'],
    items: [
      'Access or distribute unlawful material',
      'Harass or threaten others',
      'Introduce malicious software',
      'Circumvent security controls',
      'Share confidential information without authorization',
      'Engage in fraudulent activity',
      'Conduct activities that create unreasonable security, legal, or operational risks for the Company'
    ]
  },
  {
    title: '13. Email, Internet and Technology Use',
    paragraphs: ['Employees should exercise professional judgment when using Company communication systems.']
  },
  {
    title: '14. Social Media and Public Representation',
    paragraphs: ['Employees should exercise reasonable care when communicating publicly about Asterot, its clients, employees, events, or business activities. Employees must not:'],
    items: [
      'Represent personal opinions as official Company statements',
      'Disclose confidential Company or client information',
      'Publish private information about colleagues, clients, or participants without appropriate authorization',
      'Use Company branding in a misleading manner',
      'Make unauthorized public statements on behalf of Asterot'
    ]
  },
  {
    title: '14. Social Media and Public Representation',
    paragraphs: ['Only authorized representatives may issue official Company statements or communications.']
  },
  {
    title: '15. Performance and Evaluation',
    paragraphs: ['Asterot aims to support continuous employee development and professional growth. Employee performance may be evaluated periodically, including consideration of:'],
    items: [
      'Quality of work',
      'Productivity',
      'Attendance and reliability',
      'Communication',
      'Teamwork',
      'Professional conduct',
      'Initiative',
      'Responsibility',
      'Achievement of role-related objectives'
    ]
  },
  {
    title: '15. Performance and Evaluation',
    paragraphs: [
      'The Company currently intends to conduct formal performance evaluations approximately every six months, subject to operational requirements.',
      'Performance evaluations may inform decisions regarding development opportunities, responsibilities, promotions, compensation, bonuses, or other employment matters, subject to Company policy, employment agreements, business conditions, and applicable law.'
    ]
  },
  {
    title: '16. Training and Professional Development',
    paragraphs: [
      'Where appropriate, Asterot may provide or facilitate training, orientation, workshops, mentoring, or other professional development opportunities.',
      'Employees are expected to participate in required training and apply relevant knowledge to their responsibilities.',
      'Additional training may be required for employees assigned to specific event, safety, technology, or operational responsibilities.'
    ]
  },
  {
    title: '17. Disciplinary Measures',
    paragraphs: ['Failure to comply with Company policies or applicable workplace requirements may result in appropriate corrective or disciplinary action. Depending on the circumstances and severity of the matter, possible measures may include:'],
    items: [
      'Informal counseling',
      'Verbal warning',
      'Written warning',
      'Performance or corrective action plan',
      'Suspension where legally permissible',
      'Other lawful corrective measures',
      'Termination of employment where justified and permitted by applicable law'
    ]
  },
  {
    title: '17. Disciplinary Measures',
    paragraphs: [
      'The Company will consider the circumstances and seriousness of an alleged violation before determining an appropriate response.',
      'Nothing in this section authorizes disciplinary action that is prohibited by applicable law.'
    ]
  },
  {
    title: '18. Resignation and Termination',
    paragraphs: [
      'Employees who wish to resign should provide written notice in accordance with their employment agreement and applicable law.',
      'The Company may terminate employment where permitted by applicable law and the applicable employment agreement.',
      'The Company may also take immediate action in serious cases of misconduct where legally permitted.',
      'Upon separation from the Company, employees must:'
    ],
    items: [
      'Return Company property',
      'Return identification cards, equipment, documents, and other Company materials',
      'Protect confidential information',
      'Complete required handover procedures',
      'Settle outstanding Company-related responsibilities'
    ]
  },
  {
    title: '18. Resignation and Termination',
    paragraphs: ['Final payments, benefits, notice requirements, and other separation matters will be handled in accordance with applicable law, the employee’s employment agreement, and Company procedures.']
  },
  {
    title: '19. Intellectual Property and Work Product',
    paragraphs: ['Unless otherwise agreed in writing and subject to applicable law, work created by an employee in the course of their employment for Asterot may belong to the Company to the extent permitted by law. This may include:'],
    items: [
      'Business documents',
      'Event plans',
      'Designs',
      'Marketing materials',
      'Written materials',
      'Software or technical work',
      'Presentations',
      'Photographs or media created as part of assigned duties',
      'Other work product created for Company business'
    ]
  },
  {
    title: '19. Intellectual Property and Work Product',
    paragraphs: [
      'Employees must not improperly use, reproduce, or distribute Company-owned or confidential work after leaving the Company.',
      'Specific intellectual property arrangements may be addressed in employment agreements or separate written agreements.'
    ]
  },
  {
    title: '20. Personal Information and Employee Privacy',
    paragraphs: ['Asterot may collect and process personal information necessary for legitimate employment, administrative, operational, legal, and business purposes. This may include information relating to:'],
    items: [
      'Identity',
      'Contact details',
      'Employment records',
      'Attendance',
      'Leave',
      'Performance',
      'Payroll and benefits',
      'Emergency contacts',
      'Documents required for employment',
      'Other information reasonably required for lawful employment administration'
    ]
  },
  {
    title: '20. Personal Information and Employee Privacy',
    paragraphs: [
      'The Company will handle employee information in accordance with applicable law and its applicable privacy and data-handling practices.',
      'Employees are expected to protect personal information belonging to colleagues, clients, event participants, and other individuals.'
    ]
  },
  {
    title: '21. External Work and Business Activities',
    paragraphs: ['Employees should disclose outside employment, business activities, or other commitments where they may:'],
    items: [
      'Create a conflict of interest',
      'Interfere with Company responsibilities',
      'Involve use of Company resources or confidential information',
      'Harm the Company’s legitimate business interests'
    ]
  },
  {
    title: '21. External Work and Business Activities',
    paragraphs: ['The Company may review such activities and take reasonable measures where a genuine conflict exists.']
  },
  {
    title: '22. Amendments and Policy Updates',
    paragraphs: ['Asterot Bangladesh Limited reserves the right to review and update this Policy from time to time to reflect:'],
    items: [
      'Changes in applicable law',
      'Changes in Company operations',
      'Changes in organizational structure',
      'Changes in workplace practices',
      'Other legitimate business requirements'
    ]
  },
  {
    title: '22. Amendments and Policy Updates',
    paragraphs: [
      'Employees will be informed of material changes through appropriate Company communication channels.',
      'Employees are responsible for familiarizing themselves with the policies applicable to their roles.'
    ]
  },
  {
    title: '23. Interpretation and Compliance',
    paragraphs: [
      'This Policy should be read together with applicable employment agreements, Company procedures, event-specific policies, and applicable laws of Bangladesh.',
      'Where there is a conflict between this Policy and a mandatory requirement of applicable law, the applicable legal requirement will prevail.',
      'Nothing in this Policy is intended to create rights or obligations that are inconsistent with applicable law or an employee’s valid employment agreement.'
    ]
  }
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.10),_transparent_28%),linear-gradient(180deg,#050507_0%,#09090f_100%)] pt-28 text-white">
      <Container>
        <article className="mx-auto max-w-4xl py-10 sm:py-16">
          <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-white">← Back to home</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.22em] text-primary">Asterot Bangladesh Limited</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Employee Handbook &amp; Company Policy</h1>
          <p className="mt-4 text-base italic text-gray-400">“Igniting Change with Every Step”</p>
          <p className="mt-6 text-sm leading-7 text-gray-400">Effective Date: 06 August, 2026 · Last Updated: 06 August, 2026 · Version: 1.0</p>

          <div className="mt-14 space-y-12">
            {sections.map((section, index) => (
              <section key={`${section.title}-${index}`} className="border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                <div className="mt-4 space-y-4 text-gray-300 leading-8">
                  {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  {section.items && <ul className="list-disc space-y-2 pl-5 marker:text-primary">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
                </div>
              </section>
            ))}
            <section className="border-t border-white/10 pt-8">
              <h2 className="text-2xl font-semibold text-white">Approved By</h2>
              <div className="mt-4 space-y-1 text-gray-300 leading-8">
                <p className="text-base font-semibold text-white">Jaky All Naiem Jihan</p>
                <p>Chairman</p>
                <p>Asterot Bangladesh Limited</p>
              </div>
            </section>
          </div>
        </article>
      </Container>
    </main>
  )
}
