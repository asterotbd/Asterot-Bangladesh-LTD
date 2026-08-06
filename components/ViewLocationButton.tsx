"use client"
import { useState } from 'react'

export default function ViewLocationButton() {
  const [clicked, setClicked] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setClicked(true)}
        className="btn-smooth inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
      >
        View Location
        <span aria-hidden="true">↗</span>
      </button>

      <p
        aria-live="polite"
        className={`mt-3 text-sm text-gray-400 transition-opacity duration-300 ${clicked ? 'opacity-100' : 'opacity-0'}`}
      >
        Interactive map coming soon. For now, you can find us at 5B/5 Razia Sultana Road, Mohammadpur, Dhaka.
      </p>
    </div>
  )
}
