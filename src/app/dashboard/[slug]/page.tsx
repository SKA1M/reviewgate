// src/app/dashboard/[slug]/page.tsx
//
// Owner-facing dashboard: lists private feedback + AI-suggested owner notes.
// Auth: Supabase session required; user_metadata.slug must match the URL slug.

import { createClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export default async function Dashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verify session and slug ownership.
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/dashboard/login')

  const userSlug = user.user_metadata?.slug as string | undefined
  if (userSlug !== slug) {
    if (userSlug) redirect(`/dashboard/${userSlug}`)
    redirect('/dashboard/login')
  }

  const { data: client } = await admin
    .from('clients')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!client) notFound()

  const { data: rows } = await admin
    .from('feedback')
    .select('rating, comment, ai_owner_note, tapped_google, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const items = rows ?? []

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{client.name} — private feedback</h1>
        <SignOutButton />
      </div>
      <p style={{ color: '#666' }}>{items.length} recent submissions</p>
      {items.length === 0 && <p>No feedback yet.</p>}
      {items.map((f, i) => (
        <div key={i} style={{ border: '1px solid #eee', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ color: '#f5a623', fontSize: '1.1rem' }}>
            {f.rating ? '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating) : 'No rating'}
            {f.tapped_google && (
              <span style={{ color: '#1a73e8', fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                → went to Google
              </span>
            )}
          </div>
          {f.comment && <p style={{ margin: '0.5rem 0' }}>{f.comment}</p>}
          {f.ai_owner_note && (
            <p style={{ background: '#f6f9ff', borderRadius: 6, padding: '0.6rem', fontSize: '0.9rem', color: '#333' }}>
              <strong>AI note:</strong> {f.ai_owner_note}
            </p>
          )}
          <time style={{ fontSize: '0.75rem', color: '#999' }}>
            {new Date(f.created_at).toLocaleString()}
          </time>
        </div>
      ))}
    </main>
  )
}
