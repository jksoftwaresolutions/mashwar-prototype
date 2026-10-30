/** Backend base URL from VITE_API_BASE_URL (see .env.example). */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000'

export type Health = { status: 'ok' | 'degraded'; database: 'up' | 'down' }

export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const res = await fetch(`${API_BASE}/v1/health`, { signal })
  if (!res.ok && res.status !== 503) throw new Error(`Health check failed with HTTP ${res.status}`)
  return (await res.json()) as Health
}
