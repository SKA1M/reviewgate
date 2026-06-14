'use client'

// src/app/r/[slug]/FeedbackClient.tsx
//
// COMPLIANCE: `googleReviewUrl` renders below for ALL users no matter what
// `rating` is set to. The rating only changes the helper copy and whether we
// show the private comment box. Do not gate the Google button on rating.

import { useState } from 'react'

interface Props {
  slug: string
  googleReviewUrl: string
}

export default function FeedbackClient({ slug, googleReviewUrl }: Props) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function saveFeedback(tappedGoogle: boolean) {
    // Fire-and-forget; never block the customer on our DB write.
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating, comment, tappedGoogle }),
      })
    } catch {
      /* swallow — the customer's experience must not depend on this */
    }
  }

  const stars = [1, 2, 3, 4, 5]

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Optional star tap */}
      <div style={{ display: 'flex', gap: '0.4rem', fontSize: '2rem' }}>
        {stars.map((s) => (
          <button
            key={s}
            aria-label={`${s} star${s > 1 ? 's' : ''}`}
            onClick={() => setRating(s)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: rating !== null && s <= rating ? '#f5a623' : '#ccc',
              padding: 0,
            }}
          >
            ★
          </button>
        ))}
      </div>

      {/* Helper copy varies by rating — but the Google CTA below does NOT. */}
      {rating !== null && (
        <p style={{ color: '#555', marginTop: '0.75rem' }}>
          {rating >= 4
            ? 'So glad you enjoyed it! A public review really helps us.'
            : 'Thanks for the honest feedback — tell us what we can do better, and feel free to share publicly too.'}
        </p>
      )}

      {/* Private comment box (optional, shown once they've engaged) */}
      {rating !== null && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything you'd like the owner to know? (optional, private)"
          rows={3}
          style={{
            width: '100%',
            marginTop: '0.5rem',
            padding: '0.6rem',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            boxSizing: 'border-box',
          }}
        />
      )}

      {rating !== null && !submitted && (comment.trim() || rating <= 3) && (
        <button
          onClick={() => {
            saveFeedback(false)
            setSubmitted(true)
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: '#f7f7f7',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          Send private feedback
        </button>
      )}
      {submitted && (
        <p style={{ color: '#2a7', marginTop: '0.5rem' }}>
          Thanks — sent to the owner.
        </p>
      )}

      {/* ===== ALWAYS-VISIBLE PUBLIC GOOGLE CTA — shown to everyone ===== */}
      <a
        href={googleReviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => saveFeedback(true)}
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '0.85rem 1rem',
          borderRadius: 10,
          background: '#1a73e8',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '1rem',
        }}
      >
        Leave a Google review
      </a>
      <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '0.5rem' }}>
        Open to all guests — share whatever reflects your honest experience.
      </p>
    </div>
  )
}
