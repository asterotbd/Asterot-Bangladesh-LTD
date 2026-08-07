"use client"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandLogo from './BrandLogo'
import { useDismiss } from '../hooks/useDismiss'
import { useScrollLock } from '../hooks/useScrollLock'

type MenuItem = { label: string, href: string }

const eventsMenu: MenuItem[] = [
  { label: 'The Awakening Cup', href: '/events/awakening-cup' },
  { label: 'All Events', href: '/events' },
  { label: 'Upcoming Events', href: '/events/upcoming' },
  { label: 'Past Events', href: '/events/past' },
  { label: 'Event Documentation', href: '/events/documentation' }
]

const aboutMenu: MenuItem[] = [
  { label: 'Overview', href: '/about' },
  { label: 'Our Story', href: '/about/our-story' },
  { label: 'Mission & Vision', href: '/about/mission-vision' },
  { label: 'Our Values', href: '/about/values' },
  { label: 'Leadership', href: '/about/leadership' },
  { label: 'Future Vision', href: '/about/future-vision' }
]

const newsMenu: MenuItem[] = [
  { label: 'Latest News', href: '/news' },
  { label: 'Announcements', href: '/news' },
  { label: 'Articles / Updates', href: '/news' }
]

const mediaMenu: MenuItem[] = [
  { label: 'Media Overview', href: '/media' },
  { label: 'Photos', href: '/media/photos' },
  { label: 'Videos', href: '/media/videos' }
]

const MENUS: Record<string, MenuItem[]> = {
  events: eventsMenu,
  news: newsMenu,
  media: mediaMenu,
  about: aboutMenu
}

const NAV_ITEMS: { label: string, href: string, section?: string }[] = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events', section: 'events' },
  { label: 'News', href: '/news', section: 'news' },
  { label: 'Media', href: '/media', section: 'media' },
  { label: 'About Us', href: '/about', section: 'about' },
  { label: 'Contact', href: '/contact' }
]

const DropdownMenuLink = memo(function DropdownMenuLink({ href, label, active, onNavigate }: { href: string, label: string, active: boolean, onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >
      {label}
    </Link>
  )
})

const DesktopNavLink = memo(function DesktopNavLink({
  href, label, active, dropdown, open, triggerId, onFocus, onClick
}: {
  href: string
  label: string
  active: boolean
  dropdown?: boolean
  open?: boolean
  triggerId?: string
  onFocus?: () => void
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <div className="relative nav-dropdown-wrap">
      <Link
        href={href}
        data-nav-trigger={triggerId}
        onFocus={onFocus}
        onClick={onClick}
        aria-haspopup={dropdown ? 'true' : undefined}
        aria-expanded={dropdown ? open : undefined}
        aria-controls={dropdown && triggerId ? `nav-dropdown-${triggerId}` : undefined}
        className={`nav-link inline-flex items-center gap-1.5 py-2 text-sm font-medium ${active ? 'is-active' : ''}`}
      >
        {label}
        {dropdown ? <span className="nav-caret" aria-hidden="true">▾</span> : null}
      </Link>
    </div>
  )
})

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [supportsHover, setSupportsHover] = useState(true)
  const lastY = useRef(0)
  const ticking = useRef(false)
  const headerRef = useRef<HTMLElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const suppressFocusOpen = useRef(false)

  useEffect(() => {
    setSupportsHover(window.matchMedia('(hover: hover)').matches)
  }, [])

  // Lock background scrolling while the mobile drawer is open.
  useScrollLock(mobileOpen)

  // Keep the closed drawer out of the tab order and pointer hit-testing.
  useEffect(() => {
    const menu = mobileMenuRef.current
    if (!menu) return
    if (mobileOpen) menu.removeAttribute('inert')
    else menu.setAttribute('inert', '')
  }, [mobileOpen])

  const activeSection = useMemo(() => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/events')) return 'events'
    if (pathname.startsWith('/media')) return 'media'
    if (pathname.startsWith('/news')) return 'news'
    if (pathname.startsWith('/about') || pathname.startsWith('/mission-vision')) return 'about'
    if (pathname.startsWith('/contact')) return 'contact'
    return ''
  }, [pathname])

  const closeDropdown = useCallback(() => {
    setOpenDropdown(null)
  }, [])

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  const closeAllMenus = useCallback(() => {
    setOpenDropdown(null)
    setMobileOpen(false)
  }, [])

  // Close the mobile menu and dropdowns on navigation.
  useEffect(() => {
    closeMobile()
    closeDropdown()
  }, [pathname, closeMobile, closeDropdown])

  const onEscape = useCallback(() => {
    const sectionToFocus = openDropdown
    const wasMobileOpen = mobileOpen
    setOpenDropdown(null)
    setMobileOpen(false)
    if (sectionToFocus) {
      const trigger = headerRef.current?.querySelector<HTMLAnchorElement>(`[data-nav-trigger="${sectionToFocus}"]`)
      if (trigger) {
        suppressFocusOpen.current = true
        trigger.focus()
        // Safety net: never leave the flag set if the focus event was missed.
        window.setTimeout(() => { suppressFocusOpen.current = false }, 0)
      }
    } else if (wasMobileOpen) {
      toggleRef.current?.focus()
    }
  }, [openDropdown, mobileOpen])

  useDismiss(headerRef, Boolean(openDropdown || mobileOpen), {
    onOutside: closeAllMenus,
    onEscape
  })

  // Scroll behavior (hide on scroll down, show on scroll up)
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

  const handleHoverOpen = useCallback((section: string) => {
    if (!supportsHover) return
    setOpenDropdown(section)
  }, [supportsHover])

  const handleHoverClose = useCallback(() => {
    if (!supportsHover) return
    setOpenDropdown(null)
  }, [supportsHover])

  const handleTriggerFocus = useCallback((section: string) => {
    if (suppressFocusOpen.current) {
      suppressFocusOpen.current = false
      return
    }
    if (!supportsHover) return
    setOpenDropdown(section)
  }, [supportsHover])

  const handleTriggerClick = useCallback((section: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (supportsHover) return
    // Touch devices have no hover, so tapping a dropdown trigger opens/closes
    // the panel instead of navigating straight away.
    event.preventDefault()
    setOpenDropdown(prev => (prev === section ? null : section))
  }, [supportsHover])

  const sectionHandlers = useMemo(() => {
    const map: Record<string, {
      onHoverOpen: () => void
      onTriggerFocus: () => void
      onTriggerClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
    }> = {}
    for (const section of Object.keys(MENUS)) {
      map[section] = {
        onHoverOpen: () => handleHoverOpen(section),
        onTriggerFocus: () => handleTriggerFocus(section),
        onTriggerClick: handleTriggerClick(section)
      }
    }
    return map
  }, [handleHoverOpen, handleTriggerFocus, handleTriggerClick])

  const renderDropdown = (section: string) => {
    const items = MENUS[section]
    if (!items || openDropdown !== section) return null
    return (
      <div id={`nav-dropdown-${section}`} className={`nav-dropdown-panel ${openDropdown === section ? 'is-open' : ''}`}>
        {items.map(item => (
          <DropdownMenuLink
            key={`${item.href}-${item.label}`}
            href={item.href}
            label={item.label}
            active={pathname === item.href}
            onNavigate={closeDropdown}
          />
        ))}
      </div>
    )
  }

  return (
    <header ref={headerRef} className={`navbar-shell ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''}`}>
      <nav className="container navbar-inner navbar-pill" aria-label="Main navigation">
        <div className="flex items-center gap-3">
          <BrandLogo priority />
        </div>

        {/* Desktop links */}
        <div className="navbar-links">
          {NAV_ITEMS.map(item => {
            if (!item.section) {
              return (
                <DesktopNavLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  active={activeSection === item.label.toLowerCase()}
                />
              )
            }
            const section = item.section
            const handlers = sectionHandlers[section]
            return (
              <div
                key={section}
                className="dropdown-root"
                onMouseEnter={handlers.onHoverOpen}
                onMouseLeave={handleHoverClose}
              >
                <DesktopNavLink
                  href={item.href}
                  label={item.label}
                  active={activeSection === section}
                  dropdown
                  open={openDropdown === section}
                  triggerId={section}
                  onFocus={handlers.onTriggerFocus}
                  onClick={handlers.onTriggerClick}
                />
                {renderDropdown(section)}
              </div>
            )
          })}
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
          ref={toggleRef}
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
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-menu-inner">
          <MobileLink href="/" label="Home" active={activeSection === 'home'} onNavigate={closeMobile} />

          <MobileAccordion title="Events" open={activeSection === 'events'} items={eventsMenu} pathname={pathname} onNavigate={closeMobile} />
          <MobileAccordion title="About Us" open={activeSection === 'about'} items={aboutMenu} pathname={pathname} onNavigate={closeMobile} />
          <MobileAccordion title="News" open={activeSection === 'news'} items={newsMenu} pathname={pathname} onNavigate={closeMobile} />
          <MobileAccordion title="Media" open={activeSection === 'media'} items={mediaMenu} pathname={pathname} onNavigate={closeMobile} />

          <MobileLink href="/contact" label="Contact" active={activeSection === 'contact'} onNavigate={closeMobile} />

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link href="/login" onClick={closeMobile} className="block rounded-lg px-4 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white">
              Log in
            </Link>
            <Link href="/registration" onClick={closeMobile} className="block rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-gray-200">
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

const MobileLink = memo(function MobileLink({ href, label, active, onNavigate }: { href: string, label: string, active: boolean, onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block rounded-lg px-4 py-3 text-base font-medium transition ${active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
    >
      {label}
    </Link>
  )
})

const MobileAccordion = memo(function MobileAccordion({ title, open, items, pathname, onNavigate }: {
  title: string
  open: boolean
  items: MenuItem[]
  pathname: string
  onNavigate: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Reset manual expansion once the section is no longer active so stale
  // accordion state never survives a navigation.
  useEffect(() => {
    if (!open) setExpanded(false)
  }, [open])

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
            <Link key={`${item.href}-${item.label}`} href={item.href} onClick={onNavigate} className={`block rounded-lg px-3 py-2.5 text-sm transition ${pathname === item.href ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
})
