"use client"
import { useState } from 'react'

export default function ViewLocationButton() {
  const [clicked, setClicked] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setClicked(true)}
        className="btn btn-ghost"
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
