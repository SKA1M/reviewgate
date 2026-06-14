'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/dashboard/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        padding: '0.4rem 0.9rem',
        borderRadius: 6,
        border: '1px solid #ddd',
        background: '#fff',
        cursor: 'pointer',
        fontSize: '0.9rem',
      }}
    >
      Sign out
    </button>
  )
}
