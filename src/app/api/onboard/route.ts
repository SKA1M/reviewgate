// Admin-only endpoint — protected by ONBOARD_SECRET env var.
// Creates a client row, a Supabase Auth owner account, and returns a QR data URL.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

interface OnboardBody {
  secret: string
  name: string
  slug: string
  googleReviewUrl: string
  dailyBudgetUsd: number
  ownerEmail: string
  ownerPassword: string
}

export async function POST(req: Request) {
  let body: OnboardBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const secret = process.env.ONBOARD_SECRET
  if (!secret || body.secret !== secret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const slug = (body.slug ?? '').trim().toLowerCase()
  const name = (body.name ?? '').trim()
  const googleReviewUrl = (body.googleReviewUrl ?? '').trim()
  const ownerEmail = (body.ownerEmail ?? '').trim()
  const ownerPassword = body.ownerPassword ?? ''
  const dailyBudgetUsd = Number(body.dailyBudgetUsd) > 0 ? Number(body.dailyBudgetUsd) : 1.0

  if (!slug || !name || !googleReviewUrl || !ownerEmail || ownerPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid fields (password min 8 chars)' },
      { status: 400 },
    )
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 },
    )
  }

  const { error: insertErr } = await admin.from('clients').insert({
    slug,
    name,
    google_review_url: googleReviewUrl,
    daily_llm_budget_usd: dailyBudgetUsd,
  })

  if (insertErr) {
    return NextResponse.json({ success: false, error: insertErr.message }, { status: 409 })
  }

  const { error: authErr } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true, // admin-created accounts skip email verification
    user_metadata: { slug },
  })

  if (authErr) {
    // Roll back client row so slug stays available for retry.
    await admin.from('clients').delete().eq('slug', slug)
    return NextResponse.json({ success: false, error: authErr.message }, { status: 500 })
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const reviewUrl = `${base}/r/${slug}`
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
  })

  return NextResponse.json({ success: true, slug, reviewUrl, qrDataUrl })
}
