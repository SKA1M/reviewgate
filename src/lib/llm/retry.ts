// src/lib/llm/retry.ts
//
// Retry ONLY on transient errors (network, rate limit, 5xx).
// Fail fast on auth / validation errors — retrying those wastes money and
// latency and never succeeds.

import {
  APIConnectionError,
  InternalServerError,
  RateLimitError,
} from '@anthropic-ai/sdk'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

function isRetryable(err: unknown): boolean {
  return (
    err instanceof APIConnectionError ||
    err instanceof RateLimitError ||
    err instanceof InternalServerError
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isRetryable(err) || attempt === maxRetries - 1) {
        throw err // non-transient, or out of attempts
      }
      // Exponential backoff with small jitter.
      const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 100
      await sleep(delay)
    }
  }
  throw lastErr
}
