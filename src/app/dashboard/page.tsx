import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Redirect logged-in owners straight to their dashboard; everyone else to login.
export default async function DashboardIndex() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const slug = user?.user_metadata?.slug as string | undefined
  redirect(slug ? `/dashboard/${slug}` : '/dashboard/login')
}
