import type { Metadata } from 'next'
import Link from 'next/link'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'ReviewGate — More Google Reviews, Zero Policy Risk',
  description:
    "ReviewGate gives restaurants and hostels a QR-code pipeline that sends every guest to your Google listing — legally compliant with Google's review policy and the FTC's review-suppression rule.",
  openGraph: {
    title: 'ReviewGate — More Google Reviews, Zero Policy Risk',
    description:
      'A compliant QR review pipeline for hospitality businesses. Every guest gets the Google link — no gating, no FTC exposure.',
    type: 'website',
  },
}

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.22 8.22 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24zm-1.77 3.78-.44-.01c-.14 0-.37.06-.57.29-.19.22-.74.73-.74 1.77s.76 2.05.87 2.19c.11.14 1.5 2.29 3.63 3.13.51.2.9.32 1.21.42.51.15.97.13 1.34.08.41-.06 1.26-.51 1.43-1.01.18-.49.18-.92.13-1.01-.05-.09-.19-.14-.4-.25-.21-.11-1.26-.62-1.46-.69-.19-.07-.33-.11-.47.11-.14.22-.54.69-.66.83-.12.14-.25.16-.46.05-.21-.1-.88-.32-1.68-1.03-.62-.55-1.04-1.23-1.16-1.44-.12-.21-.01-.32.09-.43.09-.09.21-.25.31-.37.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.11-.47-1.14-.65-1.56z" />
  </svg>
)

export default function Home() {
  const waNumber = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP
  const waHref   = waNumber ? `https://wa.me/${waNumber.replace(/\D/g, '')}` : null
  const email    = process.env.NEXT_PUBLIC_CONTACT_EMAIL

  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" className={s.logo}>
            <span className={s.logoMark} aria-hidden />
            ReviewGate
          </Link>
          <Link href="/dashboard/login" className={s.signInLink}>
            Owner sign in
          </Link>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className={s.hero}>
          <div className={s.heroInner}>
            <span className={s.badge}>✓ Compliant by design</span>
            <h1 className={s.h1}>
              More Google reviews.<br />No policy risk.
            </h1>
            <p className={s.heroSub}>
              ReviewGate gives restaurants and hostels a QR-code pipeline that puts every guest
              one tap from your Google listing — without review gating, sentiment filtering,
              or FTC exposure.
            </p>
            <div className={s.heroActions}>
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className={s.btnPrimary}>
                  {WA_ICON} Get started on WhatsApp
                </a>
              )}
              <Link href="/dashboard/login" className={s.btnOutline}>
                Owner sign in →
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className={`${s.section} ${s.sectionSurface}`}>
          <div className={s.sectionInner}>
            <p className={s.sectionLabel}>How it works</p>
            <h2 className={s.sectionTitle}>Three steps. One tap for the guest.</h2>
            <p className={s.sectionBody}>
              No app download, no signup. The QR sticker on your table or checkout desk does all the work.
            </p>
            <div className={s.steps}>
              <div className={s.step}>
                <div className={s.stepNum}>1</div>
                <p className={s.stepTitle}>Guest scans the QR</p>
                <p className={s.stepBody}>
                  Your branded feedback page opens instantly in their browser. Works on any smartphone — iOS or Android, no install required.
                </p>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>2</div>
                <p className={s.stepTitle}>Optional: tap a star and send private feedback</p>
                <p className={s.stepBody}>
                  Guests can rate their visit and leave a private note. It lands in your dashboard with an AI summary so you can act on it quickly.
                </p>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>3</div>
                <p className={s.stepTitle}>Everyone gets the Google link — no exceptions</p>
                <p className={s.stepBody}>
                  The "Leave a Google review" button is always visible, regardless of the star rating. That's the compliance line ReviewGate never crosses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Compliance ── */}
        <section className={s.section}>
          <div className={s.sectionInner}>
            <p className={s.sectionLabel}>Why compliance is the only approach that works</p>
            <h2 className={s.sectionTitle}>Review gating can cost you your listing — and a fine</h2>
            <p className={s.sectionBody}>
              Routing unhappy guests away from Google isn't just bad practice — it's actively
              enforced. Google penalises and de-lists businesses caught doing it. The FTC's
              review-suppression rule carries fines in the tens of thousands per violation
              (the Fashion Nova settlement reached $4.2 million).
            </p>
            <div className={s.complianceGrid}>
              <div className={`${s.complianceCard} ${s.complianceCardDanger}`}>
                <p className={`${s.complianceTitle} ${s.complianceTitleDanger}`}>
                  ✗ Review gating (illegal)
                </p>
                <p className={s.complianceBody}>
                  Showing the Google link only to 4- and 5-star guests. This is exactly what
                  the FTC's review-suppression rule prohibits, and what Google has been
                  actively enforcing with listing penalties since 2024.
                </p>
              </div>
              <div className={`${s.complianceCard} ${s.complianceCardSafe}`}>
                <p className={`${s.complianceTitle} ${s.complianceTitleSafe}`}>
                  ✓ ReviewGate's approach (compliant)
                </p>
                <p className={s.complianceBody}>
                  Every guest sees the Google button — before or after any star tap. The
                  private feedback form is additive, never a gate. The compliance boundary
                  is enforced in code and covered by automated regression tests.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact CTA ── */}
        <section className={`${s.contact} ${s.sectionSurface}`}>
          <div className={s.contactInner}>
            <h2 className={s.contactTitle}>Ready to get more reviews?</h2>
            <p className={s.contactSub}>
              Setup takes under 10 minutes. We configure your page, print your QR, and you're live.
            </p>
            <div className={s.contactActions}>
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className={s.waBtn}>
                  {WA_ICON} Chat on WhatsApp
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className={s.emailBtn}>
                  ✉ Send an email
                </a>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} ReviewGate</p>
      </footer>

    </div>
  )
}
