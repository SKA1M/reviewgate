'use client'

import { useState } from 'react'

interface Result {
  slug: string
  reviewUrl: string
  qrDataUrl: string
}

export default function OnboardForm() {
  const [form, setForm] = useState({
    secret: '',
    name: '',
    slug: '',
    googleReviewUrl: '',
    dailyBudgetUsd: '1.00',
    ownerEmail: '',
    ownerPassword: '',
  })
  const [slugEdited, setSlugEdited] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function toSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugEdited ? f.slug : toSlug(value),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dailyBudgetUsd: parseFloat(form.dailyBudgetUsd) || 1.0 }),
    })
    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    setResult({ slug: data.slug, reviewUrl: data.reviewUrl, qrDataUrl: data.qrDataUrl })
  }

  if (result) {
    return (
      <div>
        <p style={{ color: '#2a7', fontWeight: 600, marginTop: 0 }}>Client created.</p>
        <p style={{ margin: '0.4rem 0' }}>
          Review link:{' '}
          <a href={result.reviewUrl} target="_blank" rel="noopener noreferrer">
            {result.reviewUrl}
          </a>
        </p>
        <img
          src={result.qrDataUrl}
          alt={`QR code for ${result.slug}`}
          style={{ display: 'block', width: 200, height: 200, margin: '1rem 0' }}
        />
        <p style={{ fontSize: '0.82rem', color: '#666', marginTop: 0 }}>
          Right-click the QR to save, or print this page.
        </p>
        <button
          onClick={() => { setResult(null); setSlugEdited(false) }}
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
          onChange={(e) => { setSlugEdited(true); set('slug', e.target.value) }}
          required
          pattern="[a-z0-9-]+"
          placeholder="beach-shack-goa"
          style={inputStyle}
        />
      </Field>

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

      {error && <p style={{ color: '#c00', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

      <button type="submit" disabled={loading} style={primaryBtn}>
        {loading ? 'Creating…' : 'Create client + generate QR'}
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
