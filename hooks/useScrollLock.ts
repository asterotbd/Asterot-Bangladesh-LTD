"use client"
import { useEffect } from 'react'

let lockCount = 0
let previousOverflow = ''

const lockBodyScroll = () => {
  lockCount += 1
  if (lockCount === 1) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

const unlockBodyScroll = () => {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
    previousOverflow = ''
  }
}

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    lockBodyScroll()
    return unlockBodyScroll
  }, [locked])
}
