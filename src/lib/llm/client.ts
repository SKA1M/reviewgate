// src/lib/llm/client.ts
//
// The ONLY place in the codebase that calls the Anthropic SDK.
// Composes: routing -> budget guard -> cached request -> retry -> cost track.
//
// Usage logging here is deliberately payload-free: we record model, tokens,
// cost, and request metadata — never raw claim content (sensitive data).

import Anthropic from '@anthropic-ai/sdk'
import { computeCost, type ModelId } from './models'
import { selectModel, type TaskKind } from './routing'
import { CostTracker, type CostRecord } from './cost'
import { callWithRetry } from './retry'
import { assertWithinBudget, dailyLimitForTier } from './budget'
import { recordUsage, getTodaySpendUsd } from './usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DEFAULT_MAX_TOKENS = 4096

export interface GenerateParams {
  /** Verified Clerk user ID — caller resolves this server-side. */
  userId: string
  /** User's plan tier, from the Stripe-synced column. */
  tier: string
  /**
   * Per-client daily spend cap in USD, read from clients.daily_llm_budget_usd.
   * When supplied, overrides the static tier fallback in dailyLimitForTier().
   */
  budgetUsd?: number
  kind: TaskKind
  /** Large, reused instruction/template — this is what gets cached. */
  systemPrompt: string
  /** The variable, per-request input (claim notes, fields, etc.). */
  userInput: string
  itemCount?: number
  forceModel?: ModelId
  maxTokens?: number
  /**
   * Prior spend for this user today. If omitted, the client loads it from
   * Supabase automatically. Pass it only if you already have it in hand
   * (e.g. to avoid a duplicate read).
   */
  priorSpendUsd?: number
}

export interface GenerateResult {
  text: string
  model: ModelId
  costUsd: number
  routedReason: string
}

/**
 * Build messages with the system prompt marked for ephemeral caching.
 * Caching applies to content >= ~1024 tokens; below that it is a no-op.
 */
function buildCachedRequest(
  model: ModelId,
  systemPrompt: string,
  userInput: string,
  maxTokens: number,
) {
  return {
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [{ role: 'user' as const, content: userInput }],
  }
}

export async function generate(params: GenerateParams): Promise<GenerateResult> {
  const limit = params.budgetUsd ?? dailyLimitForTier(params.tier)
  let tracker = new CostTracker(limit)

  // Load today's prior spend (from Supabase) unless the caller supplied it.
  const priorSpend =
    params.priorSpendUsd ?? (await getTodaySpendUsd(params.userId))
  if (priorSpend > 0) {
    // Seed prior spend as a single synthetic record so guards see real total.
    tracker = tracker.add({
      model: 'seed' as unknown as ModelId,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      costUsd: priorSpend,
      at: Date.now(),
    })
  }

  // Fail closed before spending anything.
  assertWithinBudget(tracker)

  const route = selectModel({
    kind: params.kind,
    textLength: params.userInput.length,
    itemCount: params.itemCount,
    forceModel: params.forceModel,
  })

  const req = buildCachedRequest(
    route.model,
    params.systemPrompt,
    params.userInput,
    params.maxTokens ?? DEFAULT_MAX_TOKENS,
  )

  const response = await callWithRetry(() => anthropic.messages.create(req))

  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .filter(Boolean)
    .join('\n')

  const usage = response.usage
  const cacheReadTokens =
    (usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0

  const costUsd = computeCost(route.model, {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens,
  })

  const record: CostRecord = {
    model: route.model,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens,
    costUsd,
    at: Date.now(),
  }

  // Persist usage to Supabase. Metadata ONLY — no claim payloads.
  await recordUsage(params.userId, record, route.reason)

  return { text, model: route.model, costUsd, routedReason: route.reason }
}
