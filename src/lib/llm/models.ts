// src/lib/llm/models.ts
//
// Single source of truth for model identifiers and pricing.
// Model strings and prices DRIFT — never hardcode these anywhere else.
//
// Pricing verified June 2026 (USD per 1M tokens). Update here only.
// Cache reads = 0.1x input. 5-min cache writes = 1.25x input.
// Batch API = 50% off both input and output (stacks with caching).

export const MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
} as const

export type ModelKey = keyof typeof MODELS
export type ModelId = (typeof MODELS)[ModelKey]

interface Price {
  /** USD per 1M input tokens */
  input: number
  /** USD per 1M output tokens */
  output: number
}

// Keyed by the model ID string returned in API responses.
export const PRICING: Record<ModelId, Price> = {
  [MODELS.haiku]: { input: 1.0, output: 5.0 },
  [MODELS.sonnet]: { input: 3.0, output: 15.0 },
}

const CACHE_READ_MULTIPLIER = 0.1
const PER_MILLION = 1_000_000

export interface UsageTokens {
  inputTokens: number
  outputTokens: number
  /** Tokens read from cache (billed at 0.1x input). Optional. */
  cacheReadTokens?: number
}

/** Compute USD cost for a single call, accounting for cached reads. */
export function computeCost(model: ModelId, usage: UsageTokens): number {
  const price = PRICING[model]
  if (!price) {
    // Unknown model: do not silently price at zero. Surface it.
    throw new Error(`No pricing entry for model: ${model}`)
  }
  const cacheRead = usage.cacheReadTokens ?? 0
  const billedInput = Math.max(0, usage.inputTokens - cacheRead)

  const inputCost = (billedInput / PER_MILLION) * price.input
  const cacheCost = (cacheRead / PER_MILLION) * price.input * CACHE_READ_MULTIPLIER
  const outputCost = (usage.outputTokens / PER_MILLION) * price.output

  return inputCost + cacheCost + outputCost
}
