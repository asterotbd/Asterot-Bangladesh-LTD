"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandLogo from './BrandLogo'

const eventsMenu = [
  { label: 'The Awakening Cup', href: '/events/awakening-cup' },
  { label: 'All Events', href: '/events' },
  { label: 'Upcoming Events', href: '/events/upcoming' },
  { label: 'Past Events', href: '/events/past' },
  { label: 'Event Documentation', href: '/events/documentation' }
]

const aboutMenu = [
  { label: 'Overview', href: '/about' },
  { label: 'Our Story', href: '/about/our-story' },
  { label: 'Mission & Vision', href: '/about/mission-vision' },
  { label: 'Our Values', href: '/about/values' },
  { label: 'Leadership', href: '/about/leadership' },
  { label: 'Future Vision', href: '/about/future-vision' }
]

const newsMenu = [
  { label: 'Latest News', href: '/news' },
  { label: 'Announcements', href: '/news' },
  { label: 'Articles / Updates', href: '/news' }
]

const mediaMenu = [
  { label: 'Media Overview', href: '/media' },
  { label: 'Photos', href: '/media/photos' },
  { label: 'Videos', href: '/media/videos' }
]

function DropdownMenuLink({ href, label, active }: { href: string, label: string, active?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >
      {label}
    </Link>
  )
}

function DesktopNavLink({
  href, label, active, dropdown, onMouseEnter, onMouseLeave
}: {
  href: string,
  label: string,
  active: boolean,
  dropdown?: boolean,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void
}) {
  return (
    <div
      className="relative nav-dropdown-wrap"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link
        href={href}
        className={`nav-link inline-flex items-center gap-1.5 py-2 text-sm font-medium ${active ? 'is-active' : ''}`}
      >
        {label}
        {dropdown ? <span className="nav-caret" aria-hidden="true">▾</span> : null}
      </Link>
    </div>
  )
}

export default function Navbar(){
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const lastY = useRef(0)
  const ticking = useRef(false)

  const activeSection = useMemo(() => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/events')) return 'events'
    if (pathname.startsWith('/media')) return 'media'
    if (pathname.startsWith('/news')) return 'news'
    if (pathname.startsWith('/about') || pathname.startsWith('/mission-vision')) return 'about'
    if (pathname.startsWith('/contact')) return 'contact'
    return ''
  }, [pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      window.requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY.current
        lastY.current = y

        setScrolled(y > 8)

        if (y < 10) {
          setHidden(false)
        } else if (Math.abs(delta) > 8) {
          // Scrolling down hides, scrolling up shows
          setHidden(delta > 0)
        }

        ticking.current = false
      })
    }

    if (reduced) {
      // With reduced motion, keep it visible and static.
      return
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleOpenDropdown = (name: string) => {
    setOpenDropdown(name)
  }

  const handleCloseDropdown = () => {
    setOpenDropdown(null)
  }

  const dropdownFor = (section: string) => {
    if (openDropdown !== section) return null
    if (section === 'events') return eventsMenu
    if (section === 'news') return newsMenu
    if (section === 'about') return aboutMenu
    if (section === 'media') return mediaMenu
    return null
  }

  const renderDropdown = (section: string) => {
    const items = dropdownFor(section)
    if (!items) return null
    return (
      <div className="nav-dropdown-panel">
        {items.map(item => (
          <DropdownMenuLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} active={pathname === item.href} />
        ))}
      </div>
    )
  }

  return (
    <header className={`navbar-shell ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''}`}>
      <nav className="container navbar-inner navbar-pill" aria-label="Main navigation">
        <div className="flex items-center gap-3">
          <BrandLogo priority />
        </div>

        {/* Desktop links */}
        <div className="navbar-links">
          <DesktopNavLink href="/" label="Home" active={activeSection === 'home'} />

          <div
            className="dropdown-root"
            onMouseEnter={() => handleOpenDropdown('events')}
            onMouseLeave={handleCloseDropdown}
          >
            <DesktopNavLink href="/events" label="Events" active={activeSection === 'events'} dropdown />
            {renderDropdown('events')}
          </div>

          <div
            className="dropdown-root"
            onMouseEnter={() => handleOpenDropdown('news')}
            onMouseLeave={handleCloseDropdown}
          >
            <DesktopNavLink href="/news" label="News" active={activeSection === 'news'} dropdown />
            {renderDropdown('news')}
          </div>

          <div
            className="dropdown-root"
            onMouseEnter={() => handleOpenDropdown('media')}
            onMouseLeave={handleCloseDropdown}
          >
            <DesktopNavLink href="/media" label="Media" active={activeSection === 'media'} dropdown />
            {renderDropdown('media')}
          </div>

          <div
            className="dropdown-root"
            onMouseEnter={() => handleOpenDropdown('about')}
            onMouseLeave={handleCloseDropdown}
          >
            <DesktopNavLink href="/about" label="About Us" active={activeSection === 'about'} dropdown />
            {renderDropdown('about')}
          </div>

          <DesktopNavLink href="/contact" label="Contact" active={activeSection === 'contact'} />
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions">
          <Link href="/login" className="nav-action-link">
            Log in
          </Link>
          <Link href="/registration" className="nav-action-btn">
            Register
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="navbar-toggle"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen(open => !open)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className={`hamburger ${mobileOpen ? 'is-open' : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-menu-inner">
          <MobileLink href="/" label="Home" active={activeSection === 'home'} />

          <MobileAccordion title="Events" open={activeSection === 'events'} items={eventsMenu} pathname={pathname} />
          <MobileAccordion title="About Us" open={activeSection === 'about'} items={aboutMenu} pathname={pathname} />
          <MobileAccordion title="News" open={activeSection === 'news'} items={newsMenu} pathname={pathname} />

          <MobileAccordion title="Media" open={activeSection === 'media'} items={mediaMenu} pathname={pathname} />

          <MobileLink href="/contact" label="Contact" active={activeSection === 'contact'} />

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link href="/login" className="block rounded-lg px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white">
              Log in
            </Link>
            <Link href="/registration" className="block rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-gray-200">
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileLink({ href, label, active }: { href: string, label: string, active: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-4 py-3 text-base font-medium transition ${active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >
      {label}
    </Link>
  )
}

function MobileAccordion({ title, open, items, pathname }: {
  title: string,
  open: boolean,
  items: { label: string, href: string }[],
  pathname: string
}) {
  const [expanded, setExpanded] = useState(false)
  const isExpanded = expanded || (open && items.length > 0)
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-base font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        aria-expanded={isExpanded}
        onClick={() => setExpanded(open => !open)}
      >
        {title}
        <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-1 px-2 pb-2">
          {items.map(item => (
            <Link key={`${item.href}-${item.label}`} href={item.href} className={`block rounded-lg px-3 py-2.5 text-sm transition ${pathname === item.href ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
)
}
