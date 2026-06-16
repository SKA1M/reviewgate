// Admin-only endpoint — protected by ONBOARD_SECRET env var.
// Upserts a client row; creates owner auth account and QR only for review service.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

interface SiteFacts {
  businessType?: string
  tagline?: string
  locality?: string
  region?: string
  country?: string
  phone?: string
  whatsapp?: string
  instagram?: string
  vibe?: string
  offerings?: string[]
}

interface OnboardBody {
  secret: string
  name: string
  slug: string
  services?: string[]
  googleReviewUrl?: string
  dailyBudgetUsd: number
  ownerEmail?: string
  ownerPassword?: string
  siteFacts?: SiteFacts
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
  const services: string[] =
    Array.isArray(body.services) && body.services.length > 0 ? body.services : ['review']
  const dailyBudgetUsd = Number(body.dailyBudgetUsd) > 0 ? Number(body.dailyBudgetUsd) : 1.0

  if (!slug || !name) {
    return NextResponse.json({ success: false, error: 'Missing slug or name' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 },
    )
  }

  const wantsReview = services.includes('review')
  const wantsLanding = services.includes('landing')

  const googleReviewUrl = (body.googleReviewUrl ?? '').trim()
  const ownerEmail = (body.ownerEmail ?? '').trim()
  const ownerPassword = body.ownerPassword ?? ''

  // Fetch existing client to support upsert and merge services
  const { data: existingClient } = await admin
    .from('clients')
    .select('id, services')
    .eq('slug', slug)
    .maybeSingle()

  const isNew = !existingClient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingServices: string[] = (existingClient as any)?.services ?? (isNew ? [] : ['review'])
  const mergedServices = Array.from(new Set([...existingServices, ...services]))

  // Auth user only needed when review is newly being added for this slug
  const needsAuthUser = wantsReview && !existingServices.includes('review')

  if (wantsReview && !googleReviewUrl) {
    return NextResponse.json(
      { success: false, error: 'Review QR requires a Google review URL' },
      { status: 400 },
    )
  }

  if (needsAuthUser && (!ownerEmail || ownerPassword.length < 8)) {
    return NextResponse.json(
      {
        success: false,
        error: 'New review client requires owner email and password (min 8 chars)',
      },
      { status: 400 },
    )
  }

  const clientPayload: Record<string, unknown> = {
    slug,
    name,
    daily_llm_budget_usd: dailyBudgetUsd,
    services: mergedServices,
  }

  if (wantsReview) {
    clientPayload.google_review_url = googleReviewUrl
  }

  if (wantsLanding && body.siteFacts) {
    clientPayload.site_facts = body.siteFacts
  }

  if (isNew) {
    const { error } = await admin.from('clients').insert(clientPayload)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
  } else {
    const { error } = await admin.from('clients').update(clientPayload).eq('slug', slug)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
  }

  if (needsAuthUser) {
    const { error: authErr } = await admin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { slug },
    })

    if (authErr) {
      // Roll back DB change cleanly
      if (isNew) {
        await admin.from('clients').delete().eq('slug', slug)
      } else {
        await admin.from('clients').update({ services: existingServices }).eq('slug', slug)
      }
      return NextResponse.json({ success: false, error: authErr.message }, { status: 500 })
    }
  }

  let reviewUrl: string | undefined
  let qrDataUrl: string | undefined

  if (wantsReview) {
    const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    reviewUrl = `${base}/r/${slug}`
    qrDataUrl = await QRCode.toDataURL(reviewUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  }

  return NextResponse.json({ success: true, slug, services: mergedServices, reviewUrl, qrDataUrl })
}
