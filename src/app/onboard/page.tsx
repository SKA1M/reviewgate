import OnboardForm from './OnboardForm'

export const metadata = {
  robots: { index: false },
}

export default function OnboardPage() {
  return (
    <main style={{ maxWidth: 480, margin: '3rem auto', padding: '0 1.25rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Onboard a new client</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        Creates the Supabase client row, an owner login, and a printable QR code.
      </p>
      <OnboardForm />
    </main>
  )
}
