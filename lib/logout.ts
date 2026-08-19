"use client"

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    })
  } catch {
    // Ignore network failures; navigate anyway so the UI never stays stuck
    // on a logged-in state after the cookies have been cleared.
  }
  window.location.assign('/')
}