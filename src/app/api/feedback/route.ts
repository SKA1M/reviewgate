// src/app/api/feedback/route.ts
//
// Records a private feedback submission and (optionally) generates an
// AI-suggested owner reply via the starter kit's cost-aware LLM client.
//
// COMPLIANCE: This endpoint NEVER returns or withholds the Google link based
// on rating. The client page already shows the Google CTA to everyone. This
// route only persists private feedback + generates an owner-side note. There
// is intentionally no code path here that branches the customer's Google
// access on `rating`.

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { generate } from '@/lib/llm/client'
import { checkRateLimit } from '@/lib/rate-limit'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

interface FeedbackBody {
  slug: string
  rating?: number | null
  comment?: string | null
  tappedGoogle?: boolean
}

export async function POST(req: Request) {
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0].trim() ??
    headerList.get('x-real-ip') ??
    'unknown'

  const { allowed, retryAfterSec } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    )
  }

  let body: FeedbackBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = (body.slug ?? '').trim()
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 })
  }

  const rating =
    typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null
  const comment = (body.comment ?? '').toString().slice(0, 2000) || null

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, slug, name, daily_llm_budget_usd')
    .eq('slug', slug)
    .maybeSingle()

  if (clientErr || !client) {
    return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 })
  }

  // Only spend tokens when there's actual private feedback worth summarizing
  // for the owner (a comment, or a low-ish rating that merits a response).
  let aiOwnerNote: string | null = null
  if (comment) {
    try {
      const result = await generate({
        userId: client.slug,        // tenant key for usage logging + budget
        tier: 'client',
        budgetUsd: Number(client.daily_llm_budget_usd), // per-client cap from DB
        kind: 'summarize',          // cheap → routes to Haiku
        systemPrompt: OWNER_NOTE_SYSTEM_PROMPT,
        userInput: JSON.stringify({ business: client.name, rating, comment }),
        forceModel: undefined,
      })
      aiOwnerNote = result.text.trim() || null
    } catch (err) {
      // Never block the customer's submission on an AI failure — log and move on.
      console.error('[feedback] owner-note generation failed', err)
    }
  }

  const { error: insertErr } = await admin.from('feedback').insert({
    client_id: client.id,
    rating,
    comment,
    tapped_google: Boolean(body.tappedGoogle),
    ai_owner_note: aiOwnerNote,
  })

  if (insertErr) {
    return NextResponse.json({ success: false, error: 'Could not save feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: null })
}

const OWNER_NOTE_SYSTEM_PROMPT = `You help a small hospitality business owner triage one piece of PRIVATE customer feedback (the customer was already given the option to post a public Google review separately).

Given a JSON object with the business name, an optional 1-5 rating, and a comment, write a SHORT internal note for the owner in this exact format:

Issue: <the core issue or praise in one sentence.>
Action: <a suggested next action — an operational fix, or a warm private reply they could send if contact info exists.>

Rules:
- Plain text only. No markdown, no asterisks, no bold, no bullet points, no headers.
- Under 60 words total.
- Never suggest filtering, hiding, or discouraging public reviews.
- Never suggest offering incentives in exchange for reviews or for changing/removing a review.
- If the feedback is positive, note it under Issue and suggest thanking the customer under Action.`
