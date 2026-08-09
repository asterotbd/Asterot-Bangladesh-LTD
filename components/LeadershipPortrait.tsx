"use client"
import { useState } from 'react'
import Image from 'next/image'

type Props = {
  name: string
  role: string
  image?: string
}

// Generate initials from a full name (e.g. "Jaky All Naiem Jihan" -> "JJ")
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function LeadershipPortrait({ name, role, image }: Props) {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)

  // If an image path is provided and hasn't errored, render the real photo.
  // Otherwise render a premium local placeholder (initials on gradient).
  const showImage = image && !imgError

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10 transition-all duration-500 hover:border-primary/40 hover:shadow-black/30">
      {/* Portrait area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-black">
        {showImage ? (
          // Real photo with grayscale -> color hover
          <Image
            src={image}
            alt={name}
            onError={() => setImgError(true)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover grayscale transition-all duration-500 ease-out group-hover:grayscale-0 group-hover:scale-[1.04]"
          />
        ) : (
          // Local placeholder: large initials on a premium gradient
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <span className="text-4xl font-bold tracking-tight text-white/80">{initials}</span>
            </div>
          </div>
        )}

        {/* Subtle ambient glow overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.15),_transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* Name + role */}
      <div className="p-6">
        <h3 className="text-lg font-semibold leading-tight text-white">{name}</h3>
        <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-primary">{role}</p>
      </div>
    </div>
  )
}
