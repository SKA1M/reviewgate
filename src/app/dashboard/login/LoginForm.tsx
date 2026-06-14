'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.session) {
      setError(authError?.message ?? 'Sign-in failed')
      setLoading(false)
      return
    }

    const slug = data.session.user.user_metadata?.slug as string | undefined
    router.push(slug ? `/dashboard/${slug}` : '/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={inputStyle}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={inputStyle}
      />
      {error && <p style={{ color: '#c00', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: '1rem',
  fontFamily: 'inherit',
}

const btnStyle: React.CSSProperties = {
  padding: '0.65rem',
  borderRadius: 8,
  background: '#1a73e8',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
}
