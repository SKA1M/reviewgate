'use client'

import { useState } from 'react'

type Category = 'food' | 'stay' | 'other' | ''
type MenuMode = 'static' | 'linked' | ''

interface Result {
  slug: string
  services: string[]
  reviewUrl?: string
  qrDataUrl?: string
}

interface FormState {
  secret: string
  name: string
  slug: string
  googleReviewUrl: string
  dailyBudgetUsd: string
  ownerEmail: string
  ownerPassword: string
  // Landing — common
  category: Category
  businessType: string
  locality: string
  region: string
  country: string
  phone: string
  whatsapp: string
  instagram: string
  vibe: string
  offerings: string
  hoursText: string
  mapsUrl: string
  findUsTip: string
  // Landing — Food specialized
  menuMode: MenuMode
  menuRaw: string
  menuLinkUrl: string
  // Landing — Stay specialized
  amenities: string
}

const INITIAL: FormState = {
  secret: '',
  name: '',
  slug: '',
  googleReviewUrl: '',
  dailyBudgetUsd: '1.00',
  ownerEmail: '',
  ownerPassword: '',
  category: '',
  businessType: '',
  locality: '',
  region: '',
  country: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  vibe: '',
  offerings: '',
  hoursText: '',
  mapsUrl: '',
  findUsTip: '',
  menuMode: '',
  menuRaw: '',
  menuLinkUrl: '',
  amenities: '',
}

export default function OnboardForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [services, setServices] = useState<Set<string>>(new Set(['review']))
  const [slugEdited, setSlugEdited] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const hasReview = services.has('review')
  const hasLanding = services.has('landing')

  function toSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugEdited ? f.slug : toSlug(value),
    }))
  }

  function toggleService(svc: string) {
    setServices((prev) => {
      const next = new Set(prev)
      if (next.has(svc)) next.delete(svc)
      else next.add(svc)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (services.size === 0) {
      setError('Select at least one service')
      return
    }
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {
      secret: form.secret,
      name: form.name,
      slug: form.slug,
      dailyBudgetUsd: parseFloat(form.dailyBudgetUsd) || 1.0,
      services: Array.from(services),
    }

    if (hasReview) {
      payload.googleReviewUrl = form.googleReviewUrl
      payload.ownerEmail = form.ownerEmail
      payload.ownerPassword = form.ownerPassword
    }

    if (hasLanding) {
      const siteFacts: Record<string, unknown> = {
        category: form.category,
        businessType: form.businessType,
        locality: form.locality,
        region: form.region,
        country: form.country,
        phone: form.phone,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        vibe: form.vibe,
        offerings: form.offerings.split(',').map((s) => s.trim()).filter(Boolean),
        hoursText: form.hoursText,
        mapsUrl: form.mapsUrl,
        findUsTip: form.findUsTip,
      }

      if (form.category === 'food') {
        siteFacts.menuMode = form.menuMode
        if (form.menuMode === 'static') siteFacts.menuRaw = form.menuRaw
        if (form.menuMode === 'linked') siteFacts.menuLinkUrl = form.menuLinkUrl
      }

      if (form.category === 'stay') {
        siteFacts.amenities = form.amenities
      }

      payload.siteFacts = siteFacts
    }

    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    setResult({
      slug: data.slug,
      services: data.services,
      reviewUrl: data.reviewUrl,
      qrDataUrl: data.qrDataUrl,
    })
  }

  if (result) {
    return (
      <div>
        <p style={{ color: '#2a7', fontWeight: 600, marginTop: 0 }}>Client saved.</p>
        <p style={{ margin: '0.4rem 0' }}>
          Slug: <strong>{result.slug}</strong> &nbsp;|&nbsp; Services:{' '}
          {result.services.join(', ')}
        </p>
        {result.reviewUrl && (
          <p style={{ margin: '0.4rem 0' }}>
            Review link:{' '}
            <a href={result.reviewUrl} target="_blank" rel="noopener noreferrer">
              {result.reviewUrl}
            </a>
          </p>
        )}
        {result.qrDataUrl && (
          <>
            <img
              src={result.qrDataUrl}
              alt={`QR code for ${result.slug}`}
              style={{ display: 'block', width: 200, height: 200, margin: '1rem 0' }}
            />
            <p style={{ fontSize: '0.82rem', color: '#666', marginTop: 0 }}>
              Right-click the QR to save, or print this page.
            </p>
          </>
        )}
        <button
          onClick={() => {
            setResult(null)
            setSlugEdited(false)
          }}
          style={secondaryBtn}
        >
          Add another client
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <Field label="Admin secret">
        <input
          type="password"
          value={form.secret}
          onChange={(e) => set('secret', e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Business name">
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="URL slug" hint="Lowercase letters, numbers, hyphens only">
        <input
          type="text"
          value={form.slug}
          onChange={(e) => {
            setSlugEdited(true)
            set('slug', e.target.value)
          }}
          required
          pattern="[a-z0-9-]+"
          placeholder="beach-shack-goa"
          style={inputStyle}
        />
      </Field>

      <Field label="Daily LLM budget (USD)">
        <input
          type="number"
          value={form.dailyBudgetUsd}
          onChange={(e) => set('dailyBudgetUsd', e.target.value)}
          min="0.01"
          step="0.01"
          required
          style={{ ...inputStyle, width: 100 }}
        />
      </Field>

      <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem 1rem', margin: 0 }}>
        <legend style={{ fontWeight: 500, fontSize: '0.95rem', padding: '0 0.25rem' }}>
          Services
        </legend>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasReview} onChange={() => toggleService('review')} />
          Review QR
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
          <input type="checkbox" checked={hasLanding} onChange={() => toggleService('landing')} />
          Landing page
        </label>
        {services.size === 0 && (
          <p style={{ color: '#c00', fontSize: '0.82rem', margin: '0.4rem 0 0' }}>
            Select at least one service
          </p>
        )}
      </fieldset>

      {hasReview && (
        <>
          <Field label="Google review URL">
            <input
              type="url"
              value={form.googleReviewUrl}
              onChange={(e) => set('googleReviewUrl', e.target.value)}
              required
              placeholder="https://g.page/r/…/review"
              style={inputStyle}
            />
          </Field>

          <Field label="Owner email">
            <input
              type="email"
              value={form.ownerEmail}
              onChange={(e) => set('ownerEmail', e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Owner password" hint="Min 8 characters">
            <input
              type="password"
              value={form.ownerPassword}
              onChange={(e) => set('ownerPassword', e.target.value)}
              required
              minLength={8}
              style={inputStyle}
            />
          </Field>
        </>
      )}

      {hasLanding && (
        <>
          <SectionDivider label="Landing page" />

          {/* ── Category (drives conditional sections below) ── */}
          <Field label="Business category">
            <select
              value={form.category}
              onChange={(e) => {
                set('category', e.target.value)
                set('menuMode', '')
              }}
              required
              style={inputStyle}
            >
              <option value="">Select a category…</option>
              <option value="food">Food (restaurant / cafe / bar)</option>
              <option value="stay">Stay (hostel / guesthouse / homestay)</option>
              <option value="other">Other local business</option>
            </select>
          </Field>

          {/* ── Common fields ───────────────────────────────── */}
          <Field label="Business type detail" hint="e.g. Beach shack, Fine dining, Boutique hotel">
            <input
              type="text"
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value)}
              placeholder="e.g. Beach shack, Fine dining, Boutique hotel"
              style={inputStyle}
            />
          </Field>

          <Field label="Vibe / What makes it special">
            <textarea
              value={form.vibe}
              onChange={(e) => set('vibe', e.target.value)}
              placeholder="Free-text description…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <Field label="Offerings (comma-separated)">
            <input
              type="text"
              value={form.offerings}
              onChange={(e) => set('offerings', e.target.value)}
              placeholder="Fresh seafood, Sunset cocktails, Live music"
              style={inputStyle}
            />
          </Field>

          <Field label="Locality / Neighbourhood">
            <input
              type="text"
              value={form.locality}
              onChange={(e) => set('locality', e.target.value)}
              placeholder="e.g. Palolem"
              style={inputStyle}
            />
          </Field>

          <Field label="Region / State">
            <input
              type="text"
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder="e.g. Goa"
              style={inputStyle}
            />
          </Field>

          <Field label="Country">
            <input
              type="text"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              placeholder="e.g. India"
              style={inputStyle}
            />
          </Field>

          <Field label="Hours of operation">
            <input
              type="text"
              value={form.hoursText}
              onChange={(e) => set('hoursText', e.target.value)}
              placeholder="e.g. Mon–Sun 8am–11:30pm"
              style={inputStyle}
            />
          </Field>

          <Field label="Phone">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+91 98765 43210"
              style={inputStyle}
            />
          </Field>

          <Field label="WhatsApp">
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="+91 98765 43210"
              style={inputStyle}
            />
          </Field>

          <Field label="Instagram handle">
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => set('instagram', e.target.value)}
              placeholder="@beachshackgoa"
              style={inputStyle}
            />
          </Field>

          <Field label="Where to find us">
            <textarea
              value={form.findUsTip}
              onChange={(e) => set('findUsTip', e.target.value)}
              placeholder="e.g. Look for the blue gate just past the lighthouse"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <Field label="Google Maps link">
            <input
              type="url"
              value={form.mapsUrl}
              onChange={(e) => set('mapsUrl', e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
              style={inputStyle}
            />
          </Field>

          {/* ── Food specialized ────────────────────────────── */}
          {form.category === 'food' && (
            <>
              <SectionDivider label="Menu" />

              <Field label="How does your menu work?">
                <select
                  value={form.menuMode}
                  onChange={(e) => set('menuMode', e.target.value)}
                  required
                  style={inputStyle}
                >
                  <option value="">Choose…</option>
                  <option value="static">Stable — list it on my page</option>
                  <option value="linked">Changes often — link to it</option>
                </select>
              </Field>

              {form.menuMode === 'static' && (
                <Field label="Menu (paste items — structured during review)" hint="One item per line, or free text">
                  <textarea
                    value={form.menuRaw}
                    onChange={(e) => set('menuRaw', e.target.value)}
                    placeholder={'Fish curry ₹280\nPrawn masala ₹350\n…'}
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </Field>
              )}

              {form.menuMode === 'linked' && (
                <Field label="Menu link" hint="Instagram post, Google Drive PDF, website — wherever they keep it">
                  <input
                    type="url"
                    value={form.menuLinkUrl}
                    onChange={(e) => set('menuLinkUrl', e.target.value)}
                    placeholder="https://instagram.com/p/…"
                    style={inputStyle}
                  />
                </Field>
              )}
            </>
          )}

          {/* ── Stay specialized ────────────────────────────── */}
          {form.category === 'stay' && (
            <>
              <SectionDivider label="Rooms & amenities" />

              <Field label="Amenities / room info" hint="Comma-separated or free text">
                <textarea
                  value={form.amenities}
                  onChange={(e) => set('amenities', e.target.value)}
                  placeholder="AC rooms, Hot water, Free Wi-Fi, Rooftop chill-out, Airport pickup"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Field>
            </>
          )}
        </>
      )}

      {error && <p style={{ color: '#c00', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

      <button type="submit" disabled={loading || services.size === 0} style={primaryBtn}>
        {loading ? 'Saving…' : 'Save client'}
      </button>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.95rem' }}>
      <span style={{ fontWeight: 500 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: '0.8rem', color: '#888' }}>{hint}</span>}
    </label>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>
      {label}
    </p>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: '1rem',
  fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  padding: '0.7rem',
  borderRadius: 8,
  background: '#1a73e8',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '0.95rem',
}
