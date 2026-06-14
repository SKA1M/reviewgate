// src/lib/llm/budget.ts
//
// Budget guards. The guard runs BEFORE the API call and fails closed.
// Per-user limits should be wired to the Stripe plan tier so an expired or
// over-limit user cannot run up API spend.

import type { CostTracker } from './cost'

export class BudgetExceededError extends Error {
  constructor(
    readonly spent: number,
    readonly limit: number,
  ) {
    super(`Budget exceeded: spent $${spent.toFixed(4)} of $${limit.toFixed(4)}`)
    this.name = 'BudgetExceededError'
  }
}

/**
 * Resolve a user's spend limit from their plan tier.
 * Wire `tier` to the subscription_status / plan column synced by the Stripe
 * webhook. Values here are illustrative — set them from your real pricing.
 */
// ReviewGate note: in this product the "tier" is not an end-user plan — it is a
// per-CLIENT safety cap that protects YOUR Anthropic bill. The feedback route
// passes tier:'client'; the real per-client number lives in the clients table
// (daily_llm_budget_usd) and should be passed via priorSpendUsd-aware callers.
// This map is just the fallback ceiling so a misconfigured client can't run wild.
const TIER_DAILY_LIMIT_USD: Record<string, number> = {
  client: 1.0, // fallback per-client daily cap (USD); override per client in DB
  free: 0.25,
}

export function dailyLimitForTier(tier: string): number {
  return TIER_DAILY_LIMIT_USD[tier] ?? TIER_DAILY_LIMIT_USD.free
}

/**
 * Throw BEFORE making a call if the user is already over budget, or if this
 * call's worst-case estimate would push them over. Fails closed.
 */
export function assertWithinBudget(
  tracker: CostTracker,
  estimatedCostUsd = 0,
): void {
  const projected = tracker.totalCost + estimatedCostUsd
  if (projected > tracker.budgetLimit) {
    throw new BudgetExceededError(projected, tracker.budgetLimit)
  }
}
