// src/app/r/[slug]/page.tsx
//
// The QR landing page. A customer scans the table/desk QR and lands here.
//
// =============================================================================
// THIS PAGE IS THE COMPLIANCE BOUNDARY. READ BEFORE EDITING.
//
// The public Google review link is rendered for EVERY visitor, unconditionally,
// and is never hidden, delayed, or de-emphasized based on the star they tap.
// The star tap is OPTIONAL and only personalizes helper text + captures private
// feedback. Removing the always-visible Google CTA, or wrapping it in a
// rating condition, turns this from a legal tool into illegal review gating
// (prohibited by Google policy and the FTC's review-suppression rule).
// =============================================================================

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FeedbackClient from './FeedbackClient'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: client } = await admin
    .from('clients')
    .select('slug, name, google_review_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!client) notFound()

  return (
    <main
      style={{
        maxWidth: 460,
        margin: '0 auto',
        padding: '2rem 1.25rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>
        How was your visit to {client.name}?
      </h1>
      <p style={{ color: '#555', marginTop: 0 }}>
        Your feedback helps us improve. It only takes a few seconds.
      </p>

      <FeedbackClient
        slug={client.slug}
        googleReviewUrl={client.google_review_url}
      />
    </main>
  )
}
