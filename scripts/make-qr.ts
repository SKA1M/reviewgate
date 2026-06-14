// scripts/make-qr.ts
//
// Generate a printable QR PNG that points at a client's review landing page.
// Usage: npm run qr -- <client-slug>
// Output: ./qr-<slug>.png  (print it, stick it on the table / checkout desk)

import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: npm run qr -- <client-slug>')
  process.exit(1)
}

const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
const url = `${base.replace(/\/$/, '')}/r/${slug}`

QRCode.toFile(
  `qr-${slug}.png`,
  url,
  { width: 800, margin: 2, errorCorrectionLevel: 'M' },
  (err) => {
    if (err) {
      console.error('QR generation failed:', err)
      process.exit(1)
    }
    console.log(`✓ Wrote qr-${slug}.png  →  ${url}`)
  },
)
