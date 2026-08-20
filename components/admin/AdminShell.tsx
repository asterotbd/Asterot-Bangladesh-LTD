"use client"
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useDismiss } from '../../hooks/useDismiss'
import { useScrollLock } from '../../hooks/useScrollLock'
import { logout } from '../../lib/logout'

export type AdminNavItem = { label: string; href: string; icon: string; group?: string }
export type AdminShellUser = { name: string; email: string; roles: string[] }

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

type IconProps = { className?: string }

function NavIcon({ name, className = 'h-5 w-5' }: { name: string } & IconProps) {
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'events':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18" />
        </svg>
      )
    case 'news':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M4 5h16v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      )
    case 'company':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
          <path d="M15 9h4a1 1 0 0 1 1 1v11" />
          <path d="M3 21h18" />
          <path d="M8 8h2M8 12h2M8 16h2" />
        </svg>
      )
    case 'content':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M9 7h7M9 11h7" />
        </svg>
      )
    case 'homepage':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" />
          <path d="M9 21v-6h6v6" />
        </svg>
      )
    case 'albums':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5-9 9" />
        </svg>
      )
    case 'videos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M10 9l5 3-5 3V9z" />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'roles':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'permissions':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      )
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      )
    case 'media':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="M21 15l-5-5-5 5" />
        </svg>
      )
    case 'activity':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M22 12h-4l-3 8-6-16-3 8H2" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    default:
      return null
  }
}

function UserIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

function LogoutIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function MenuIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export default function AdminShell({
  user,
  navItems,
  children
}: {
  user: AdminShellUser
  navItems: AdminNavItem[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement | null>(null)

  useScrollLock(mobileOpen)
  useDismiss(drawerRef, mobileOpen, {
    onOutside: () => setMobileOpen(false),
    onEscape: () => setMobileOpen(false)
  })

  // Keep the closed drawer out of the tab order and pointer hit-testing.
  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return
    if (mobileOpen) drawer.removeAttribute('inert')
    else drawer.setAttribute('inert', '')
  }, [mobileOpen])

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const initials = (user.name || user.email || 'A').trim().slice(0, 2).toUpperCase()
  const roleLabel = user.roles.map((role) => ROLE_LABELS[role] || role).join(', ') || 'Staff'

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white">
          Asterot <span className="text-primary">Admin</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        {navItems.reduce<{ group: string | null; items: AdminNavItem[] }[]>((groups, item) => {
          const g = item.group ?? null
          const last = groups[groups.length - 1]
          if (last && last.group === g) last.items.push(item)
          else groups.push({ group: g, items: [item] })
          return groups
        }, []).map((group, groupIndex) => (
          <div key={group.group ?? `nav-${groupIndex}`} className={groupIndex > 0 ? 'mt-5' : ''}>
            {group.group && (
              <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-600">{group.group}</p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        active ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span className={clsx('h-4 w-1 shrink-0 rounded-full transition-colors', active ? 'bg-primary' : 'bg-transparent')} />
                      <NavIcon name={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold uppercase text-primary">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user.name}</span>
            <span className="block truncate text-xs text-gray-500">{user.email}</span>
            <span className="block truncate text-xs text-primary">{roleLabel}</span>
          </span>
        </div>
        <div className="mt-1 space-y-1">
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <UserIcon />
            Account
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#0B0B10] px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle admin menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(value => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white">
            Asterot <span className="text-primary">Admin</span>
          </span>
        </div>
        <Link href="/account" aria-label="Account" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-colors hover:text-white">
          <UserIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Mobile drawer */}
      <div className={clsx('fixed inset-0 z-50 lg:hidden', !mobileOpen && 'pointer-events-none')} aria-hidden={!mobileOpen}>
        <div
          className={clsx('absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMobileOpen(false)}
        />
        <div
          ref={drawerRef}
          className={clsx(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0B0B10] shadow-2xl transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0B0B10] lg:flex">
        {sidebarContent}
      </aside>

      {/* Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[70rem]">{children}</div>
        </main>
      </div>
    </div>
  )
}