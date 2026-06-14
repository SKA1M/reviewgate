// src/lib/llm/cost.ts
//
// Immutable cost tracking. Every API call produces a CostRecord; the tracker
// returns a NEW tracker on add() and never mutates. This makes spend
// auditable and makes the budget guard trivial to reason about.

import type { ModelId } from './models'

export interface CostRecord {
  readonly model: ModelId
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly costUsd: number
  readonly at: number // epoch ms
}

export class CostTracker {
  readonly budgetLimit: number
  readonly records: ReadonlyArray<CostRecord>

  constructor(budgetLimit: number, records: ReadonlyArray<CostRecord> = []) {
    this.budgetLimit = budgetLimit
    this.records = records
  }

  /** Return a NEW tracker with the record appended. Never mutates. */
  add(record: CostRecord): CostTracker {
    return new CostTracker(this.budgetLimit, [...this.records, record])
  }

  get totalCost(): number {
    return this.records.reduce((sum, r) => sum + r.costUsd, 0)
  }

  get overBudget(): boolean {
    return this.totalCost > this.budgetLimit
  }

  /** Headroom remaining before the limit (can go negative). */
  get remaining(): number {
    return this.budgetLimit - this.totalCost
  }
}
