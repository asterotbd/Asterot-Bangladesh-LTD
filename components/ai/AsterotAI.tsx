"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Core types

type AiAction = {
  label: string
  href: string
}

type AiMessage = {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

// === Constants ===

const ASSISTANT_NAME = 'AstroBOT'
const ASSISTANT_DESCRIPTOR = "Asterot's AI Guide"
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY = 50
const PANEL_ID = 'astrobot-panel'

// Safe, route-based prompts only — every href here is one of the backend's
// approved navigation targets (app/api/ai/guide/route.ts APPROVED_ROUTES).
// No company facts are asserted by this copy.
const INITIAL_SUGGESTIONS: Array<{ label: string; href: string }> = [
  { label: 'What is Asterot?', href: '/' },
  { label: 'Explore events', href: '/events' },
  { label: 'Latest news', href: '/news' },
  { label: 'View photos & videos', href: '/media/videos' },
  { label: 'Contact us', href: '/contact' }
]

// === Icon marks ===
// Small inline SVGs in the site's own brand colors, matching the kinetic/
// star motif already used in the hero — no icon package required.

function SparkMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="astrobot-spark" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2D6D" />
          <stop offset="100%" stopColor="#FF165A" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5c.6 3.4 1.4 5.7 2.7 7 1.3 1.3 3.6 2.1 7 2.7-3.4.6-5.7 1.4-7 2.7-1.3 1.3-2.1 3.6-2.7 7-.6-3.4-1.4-5.7-2.7-7-1.3-1.3-3.6-2.1-7-2.7 3.4-.6 5.7-1.4 7-2.7 1.3-1.3 2.1-3.6 2.7-7Z"
        fill="url(#astrobot-spark)"
      />
      <circle cx="19" cy="5" r="1.35" fill="url(#astrobot-spark)" opacity="0.85" />
    </svg>
  )
}

function CloseIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M5 12h13.5M13 6.5L19 12l-6 5.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SpinnerIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  )
}

// === AsterotAI component ===

export default function AsterotAI({
  name = ASSISTANT_NAME
}: { name?: string } = {}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<AiAction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Focus the input the moment the panel opens, so keyboard users can start
  // typing immediately without an extra Tab press.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Escape closes the panel from anywhere on the page.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Keep the latest message in view.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, loading])

  // Add a message to state
  const addMessage = (
    msg: Omit<AiMessage, 'loading'> & { loading?: boolean }
  ) => {
    setMessages((prev) => {
      if (prev.length >= MAX_HISTORY) {
        const trimmed = [...prev.slice(-(MAX_HISTORY - 1)), msg]
        return trimmed
      }
      return [...prev, msg]
    })
  }

  // Send user message to API
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setError(null)
    setLoading(true)
    setShowSuggestions(false)

    try {
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation: messages,
          pageContext: {
            pathname: window.location.pathname,
            title: document.title
          }
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData.error || 'AI service error'
        setError(errMsg)
        addMessage({ role: 'assistant', content: `Sorry, ${errMsg}` })
        return
      }

      const data = (await res.json()) as { message: string; actions?: AiAction[]; error?: string }

      if (data.error) {
        setError(data.error)
        addMessage({ role: 'assistant', content: `Sorry, ${data.error}` })
        return
      }

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: data.message,
        loading: false
      })

      // Update suggestions if actions returned
      if (data.actions && data.actions.length > 0) {
        setSuggestions(data.actions)
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    } catch (e) {
      setError('Network error. Please try again.')
      addMessage({ role: 'assistant', content: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Open/close toggle
  const toggle = () => setOpen((prev) => !prev)

  // Quick action click
  const handleActionClick = (href: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: `Take me to ${href === '/' ? 'the homepage' : href}` }])
    setShowSuggestions(false)
    router.push(href)
  }

  const hasMessages = messages.length > 0

  // === Closed state: launcher ===

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={false}
        aria-controls={PANEL_ID}
        aria-label={`Open ${name} — ${ASSISTANT_DESCRIPTOR}`}
        title={`${name} — ${ASSISTANT_DESCRIPTOR}`}
        className="group fixed z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[rgba(11,11,16,0.92)] shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 focus-visible:-translate-y-0.5 active:scale-95"
        style={{
          bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
          right: 'max(1.25rem, env(safe-area-inset-right))'
        }}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <SparkMark className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
      </button>
    )
  }

  // === Open state: panel ===

  return (
    <div
      id={PANEL_ID}
      role="dialog"
      aria-label={`${name}, ${ASSISTANT_DESCRIPTOR}`}
      className="fixed inset-x-0 bottom-0 z-50 flex w-full flex-col overflow-hidden border border-white/10 bg-[rgba(9,9,13,0.94)] shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300 ease-out rounded-t-[1.75rem] max-h-[86vh] pb-[env(safe-area-inset-bottom)] sm:inset-auto sm:bottom-5 sm:right-[calc(1.25rem+env(safe-area-inset-right))] sm:w-[23.5rem] sm:max-h-[38rem] sm:rounded-[1.75rem] sm:pb-0"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <SparkMark className="h-[1.125rem] w-[1.125rem]" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-white">{name}</p>
            <p className="text-xs text-white/50">{ASSISTANT_DESCRIPTOR}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label="Close AstroBOT"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Conversation area */}
      <div
        className="flex-1 overflow-y-auto px-5 py-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <SparkMark className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">Hello, I&rsquo;m {name}.</p>
              <p className="mt-1 text-sm text-white/50">{ASSISTANT_DESCRIPTOR}</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {INITIAL_SUGGESTIONS.map((s) => (
                <button
                  key={s.href}
                  type="button"
                  onClick={() => handleActionClick(s.href)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition-colors duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <li key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <span className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <SparkMark className="h-3 w-3" />
                    </span>
                  )}
                  <div
                    className={
                      isUser
                        ? 'max-w-[85%] rounded-2xl rounded-br-md border border-primary/25 bg-primary/15 px-4 py-2.5 text-[0.925rem] leading-relaxed text-white'
                        : 'max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-2.5 text-[0.925rem] leading-relaxed text-white/90'
                    }
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {msg.content}
                  </div>
                </li>
              )
            })}

            {loading && (
              <li className="flex justify-start">
                <span className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <SparkMark className="h-3 w-3" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3">
                  <span className="sr-only">{name} is thinking</span>
                  <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.3s]" />
                  <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.15s]" />
                  <span aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" />
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Navigation suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="shrink-0 border-t border-white/10 px-5 py-3">
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.15em] text-white/40">Explore</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleActionClick(action.href)}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 transition-colors duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-white"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-4 pr-1.5 py-1.5 transition-colors duration-200 focus-within:border-primary/40">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            placeholder={`Message ${name}…`}
            disabled={loading}
            aria-label={`Message ${name}`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            title="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-black transition-all duration-200 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <SpinnerIcon className="h-4 w-4" /> : <SendIcon />}
          </button>
        </div>
        {error && <p className="mt-2 px-1 text-xs text-primary">{error}</p>}
      </form>
    </div>
  )
}

export type { AiAction, AiMessage }
