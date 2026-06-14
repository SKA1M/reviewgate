// src/lib/llm/routing.ts
//
// Route to the cheapest model that clears the quality bar.
// Haiku for extraction / short summaries / classification.
// Sonnet for full narrative generation and multi-document synthesis.
//
// Thresholds are starting points — LOG decisions (see client.ts) and tune
// from real data. Do not scatter model choices through the codebase; this
// is the only place routing happens.

import { MODELS, type ModelId } from './models'

// Above either threshold, treat the task as "complex" and use Sonnet.
const SONNET_TEXT_THRESHOLD = 10_000 // characters of input
const SONNET_ITEM_THRESHOLD = 30 // discrete items (e.g. line-item claims)

export type TaskKind =
  | 'extract' // pull structured fields from notes — cheap
  | 'classify' // categorize a claim/peril — cheap
  | 'summarize' // short summary — cheap
  | 'narrative' // full claim narrative — capable
  | 'synthesis' // combine multiple docs — capable

// Some task kinds are always complex regardless of size.
const ALWAYS_SONNET: ReadonlySet<TaskKind> = new Set(['narrative', 'synthesis'])

export interface RouteInput {
  kind: TaskKind
  textLength: number
  itemCount?: number
  /** Override routing (e.g. forced high quality for a paying enterprise tier). */
  forceModel?: ModelId
}

export interface RouteDecision {
  model: ModelId
  reason: string
}

export function selectModel(input: RouteInput): RouteDecision {
  if (input.forceModel) {
    return { model: input.forceModel, reason: 'forced' }
  }
  if (ALWAYS_SONNET.has(input.kind)) {
    return { model: MODELS.sonnet, reason: `kind:${input.kind}` }
  }
  const items = input.itemCount ?? 0
  if (input.textLength >= SONNET_TEXT_THRESHOLD) {
    return { model: MODELS.sonnet, reason: 'text-length' }
  }
  if (items >= SONNET_ITEM_THRESHOLD) {
    return { model: MODELS.sonnet, reason: 'item-count' }
  }
  return { model: MODELS.haiku, reason: 'simple' }
}
