"use client"

import { useState } from 'react'
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

const DEFAULT_AI_NAME = 'Asterot AI'
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY = 50
const INITIAL_SUGGESTIONS: Array<{ label: string; href: string }> = [
  { label: 'What is Asterot?', href: '/' },
  { label: 'Explore events', href: '/events' },
  { label: 'Latest news', href: '/news' },
  { label: 'View photos & videos', href: '/media/videos' },
  { label: 'Contact us', href: '/contact' },
]

// === AsterotAI component ===

export default function AsterotAI({
  name = DEFAULT_AI_NAME,
}: { name?: string } = {}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<AiAction[]>(INITIAL_SUGGESTIONS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const router = useRouter()

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
    if (!trimmed) return

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation: messages,
          pageContext: {
            pathname: window.location.pathname,
            title: document.title,
          },
        }),
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
        loading: false,
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
  const toggle = () => setOpen(!open)

  // Quick action click
  const handleActionClick = (href: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: `Let me go to ${href}` }])
    router.push(href)
  }

  // === Render ===

  const classes = {
    button:
      `fixed bottom-4 right-4 z-50 rounded-full bg-primary text-white p-3 hover:bg-primary/90 shadow-lg transition-transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center`,
    panel:
      `fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-transform ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`,
    panelCompact: 'p-4',
    header: 'flex items-center justify-between border-b pb-3',
    headerTitle: 'text-xl font-bold text-gray-800',
    headerClose: 'text-gray-400 hover:text-gray-600',
    messages: 'h-64 overflow-y-auto p-4 space-y-2',
    messageUser:
      'bg-primary/10 text-primary px-3 py-2 rounded-md max-w-full',
    messageAssistant:
      'bg-gray-50 text-gray-800 px-3 py-2 rounded-md max-w-full break-words',
    suggestions: 'mt-4 grid grid-cols-2 gap-2',
    suggestion:
      'px-3 py-2 rounded-text text-sm text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors',
    input:
      'mt-2 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
    submit:
      'w-full bg-primary text-white py-2 rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  }

  if (!open) {
    return (
      <button
        className={classes.button}
        aria-label={name}
        onClick={toggle}
        title={name}
      >
        AI
      </button>
    )
  }

  return (
    <div className={classes.panel}>
      <div className={classes.header}>
        <span className={classes.headerTitle}>{name}</span>
        <button
          className={classes.headerClose}
          aria-label="Close AI assistant"
          onClick={toggle}
        >
          ×
        </button>
      </div>

      <div className={classes.messages}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const className = isUser ? classes.messageUser : classes.messageAssistant
          return (
            <div
              key={i}
              className={className}
              style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              {msg.content}
            </div>
          )
        })}

        {loading && (
          <div className="bg-gray-100 p-2 rounded-md text-sm">
            Thinking...
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className={classes.suggestions}>
          {suggestions.map((action, i) => (
            <button
              key={i}
              className={classes.suggestion}
              onClick={() => handleActionClick(action.href)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="pt-3"
        noValidate
      >
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(e)}
            className={classes.input}
            placeholder="Ask Asterot AI..."
            disabled={loading}
            aria-live="polite"
            aria-atomic="true"
          />
          <button
            type="submit"
            className={classes.submit}
            disabled={loading}
            aria-label="Send message"
            title="Send"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export type { AiAction, AiMessage }
