import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ReviewGate',
  description: 'Quick and honest — share your experience.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
