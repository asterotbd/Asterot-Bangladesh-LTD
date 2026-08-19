import { NextResponse } from 'next/server'

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function isDateOnlyString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function isIsoDateString(value: string): boolean {
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && /T\d{2}:\d{2}/.test(value)
}

export function isTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

export function parseJsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null)
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error)
}