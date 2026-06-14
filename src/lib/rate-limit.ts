// In-memory fixed-window rate limiter. Works well for single-instance (dev,
// long-running Node). On multi-instance serverless deployments each instance
// enforces independently — acceptable for low-traffic hospitality QR pages.
// Replace with Upstash Redis if you need strict cross-instance enforcement.

interface Window {
  count: number
  resetAt: number
}

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_PER_WINDOW = 5

const store = new Map<string, Window>()

function sweep(now: number) {
  for (const [key, w] of store) {
    if (w.resetAt <= now) store.delete(key)
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  sweep(now)

  const w = store.get(ip)

  if (!w || w.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (w.count >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) }
  }

  w.count++
  return { allowed: true, retryAfterSec: 0 }
}
