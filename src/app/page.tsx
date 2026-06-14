// Root page — guests land on /r/[slug], owners on /dashboard/[slug].
// This catches bare visits to / with a minimal fallback.
export default function Home() {
  return (
    <main style={{ maxWidth: 460, margin: '4rem auto', padding: '0 1.25rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.4rem' }}>ReviewGate</h1>
      <p style={{ color: '#555' }}>
        Scan the QR code at your table to leave feedback.
      </p>
    </main>
  )
}
