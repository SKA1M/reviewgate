// src/lib/llm/usage.ts
//
// Server-side persistence + read for LLM usage. Uses the Supabase SERVICE ROLE
// client (bypasses RLS) and must only ever run server-side. Records metadata
// only — never prompt or response content.

import { createClient } from '@supabase/supabase-js'
import type { CostRecord } from './cost'

// Service-role client. Never import this into a Client Component.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

/** Insert one usage record. Metadata only; no claim content. */
export async function recordUsage(
  userId: string,
  record: CostRecord,
  routedReason: string,
): Promise<void> {
  const { error } = await admin.from('llm_usage').insert({
    user_id: userId,
    model: record.model,
    input_tokens: record.inputTokens,
    output_tokens: record.outputTokens,
    cache_read_tokens: record.cacheReadTokens,
    cost_usd: record.costUsd,
    routed_reason: routedReason,
  })
  // Never throw from accounting into the user's request path — log instead.
  if (error) {
    console.error('[llm] failed to record usage', { userId, error: error.message })
  }
}

/** Sum a user's spend for the current UTC day. Used to seed the budget guard. */
export async function getTodaySpendUsd(userId: string): Promise<number> {
  const { data, error } = await admin
    .from('llm_usage_today')
    .select('spend_usd')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    // Fail SAFE for spend: if we cannot read prior spend, assume the worst
    // is not knowable and let the per-request guard still apply. Returning 0
    // here would under-count; returning Infinity would block all calls.
    // We choose to log and return 0, relying on the per-request estimate and
    // alerting. Adjust to your risk tolerance.
    console.error('[llm] failed to read today spend', { userId, error: error.message })
    return 0
  }
  return Number(data?.spend_usd ?? 0)
}
