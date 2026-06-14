/**
 * Compliance regression guard.
 *
 * These tests exist to make ILLEGAL review gating impossible to accidentally
 * introduce. A reviewer suppressing the Google CTA based on rating would be a
 * violation of Google's review policy and the FTC review-suppression rule.
 *
 * Rule: the Google "Leave a review" link must be visible for ALL guests,
 * regardless of star rating. If any test here starts failing after a code
 * change, the change has introduced review gating and must be reverted.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FeedbackClient from '@/app/r/[slug]/FeedbackClient'

// ---------------------------------------------------------------------------
// Module mocks (hoisted by Vitest before imports are evaluated)
// ---------------------------------------------------------------------------

const clientRow = {
  id: 'uuid-client-1',
  slug: 'test-café',
  name: 'Test Café',
  daily_llm_budget_usd: 1.0,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) =>
      table === 'clients'
        ? {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: clientRow, error: null }),
          }
        : { insert: vi.fn().mockResolvedValue({ error: null }) },
  }),
}))

vi.mock('@/lib/llm/client', () => ({
  generate: vi.fn().mockResolvedValue({
    text: 'Guest enjoyed the food. Suggested action: send a thank-you.',
    model: 'claude-haiku-4-5-20251001',
    costUsd: 0.00004,
    routedReason: 'cheap',
  }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => (key === 'x-forwarded-for' ? '203.0.113.1' : null),
  }),
}))

// Always allow in unit tests — rate-limiting is tested separately if needed.
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, retryAfterSec: 0 }),
}))

// ---------------------------------------------------------------------------
// Import route after mocks are registered
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/feedback/route'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeRequest(body: object) {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// FeedbackClient — Google CTA always visible
// ---------------------------------------------------------------------------

describe('FeedbackClient — Google CTA is always visible', () => {
  const GOOGLE_URL = 'https://g.page/r/ABC123/review'

  beforeEach(() => {
    // Prevent real fetch calls from saveFeedback() during tests.
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
  })

  it('shows the Google review link before any star is tapped', () => {
    render(<FeedbackClient slug="test-café" googleReviewUrl={GOOGLE_URL} />)
    const link = screen.getByRole('link', { name: /leave a google review/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', GOOGLE_URL)
  })

  it.each([1, 2, 3, 4, 5])(
    'shows the Google review link after tapping %i star(s)',
    (rating) => {
      render(<FeedbackClient slug="test-café" googleReviewUrl={GOOGLE_URL} />)
      fireEvent.click(
        screen.getByRole('button', { name: `${rating} star${rating > 1 ? 's' : ''}` }),
      )
      const link = screen.getByRole('link', { name: /leave a google review/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', GOOGLE_URL)
    },
  )
})

// ---------------------------------------------------------------------------
// Feedback API route — never gates Google access by rating
// ---------------------------------------------------------------------------

describe('POST /api/feedback — never withholds Google access by rating', () => {
  it.each([1, 2, 3, 4, 5])(
    'returns 200 for rating %i with no Google-gating field in the response',
    async (rating) => {
      const res = await POST(
        makeRequest({ slug: 'test-café', rating, comment: 'Good experience', tappedGoogle: false }),
      )
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      // Compliance: the route must never return a field that controls whether
      // the client shows the Google CTA. If these properties ever appear in the
      // response body, someone has introduced review gating.
      expect(body).not.toHaveProperty('googleUrl')
      expect(body).not.toHaveProperty('showGoogleCta')
      expect(body).not.toHaveProperty('allowGoogleReview')
      expect(body).not.toHaveProperty('gated')
    },
  )

  it('returns 200 with no rating and no Google-gating field', async () => {
    const res = await POST(
      makeRequest({ slug: 'test-café', rating: null, comment: null, tappedGoogle: true }),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body).not.toHaveProperty('googleUrl')
    expect(body).not.toHaveProperty('showGoogleCta')
    expect(body).not.toHaveProperty('allowGoogleReview')
    expect(body).not.toHaveProperty('gated')
  })
})
