# ReviewGate

A compliant QR review pipeline for small hospitality businesses. A guest scans a
QR at the table or checkout desk, lands on a one-tap page, and is invited to leave
a public Google review **and** (optionally) send the owner private feedback. An
LLM triages each private comment into a short note for the owner.

Built on the cost-aware `lib/llm` client vendored from `ai-starter-kit`.

## ⚠️ The one rule that makes this legal

**The Google review link is shown to every guest, regardless of the star they tap.**

This is NOT "review gating." Review gating — routing happy guests to Google and
unhappy guests to a private form instead — is prohibited by Google's review policy
(actively enforced as of 2026) and by the FTC's review-suppression rule (penalties
in the tens of thousands of dollars per violation; see the Fashion Nova settlement).

Here, the optional star tap only (a) captures private feedback and (b) changes
helper copy. It never decides who can reach Google. The compliance boundary lives
in `src/app/r/[slug]/FeedbackClient.tsx` and `src/app/api/feedback/route.ts` —
both are commented. Do not add a rating condition around the Google CTA.

## Stack

Next.js (App Router) · TypeScript · Supabase · vendored `lib/llm` (Anthropic).

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill it in.
3. Run `supabase/schema.sql` against your Supabase project.
4. Insert a client row:
   ```sql
   insert into clients (slug, name, google_review_url)
   values ('beach-shack-goa', 'Beach Shack', 'https://g.page/r/XXXX/review');
   ```
5. Generate the QR: `npm run qr -- beach-shack-goa` → prints `qr-beach-shack-goa.png`.
6. `npm run dev`, visit `/r/beach-shack-goa`.

## What's scaffolded vs. what's left

Done: schema, QR landing page (compliant), private-feedback API with AI owner
notes via `lib/llm`, QR script, owner dashboard (read-only), per-client LLM budget cap.

Hand the prompt below to **Claude Code** to finish production-readiness.

---

### Claude Code prompt (paste into `claude` at the repo root)

> This is ReviewGate, a Next.js + Supabase + TypeScript app that uses a vendored
> cost-aware Anthropic client in `src/lib/llm`. Read the README's compliance
> section first — the Google review CTA must remain visible to all guests
> regardless of rating; never gate it by sentiment.
>
> Finish these, in order, running `npm run typecheck` after each:
> 1. Add `next.config.js`, `app/layout.tsx`, and a root `app/page.tsx` so the app
>    builds. Add `next-env.d.ts`.
> 2. Add authentication to `/dashboard/[slug]` (Clerk or Supabase Auth — pick one,
>    justify briefly) so only the owning client can see their feedback. Leave the
>    public `/r/[slug]` route open.
> 3. Add rate limiting to `POST /api/feedback` (per-IP, in-memory or Upstash) per
>    the kit's `rules/security.md`.
> 4. Enforce the per-client `daily_llm_budget_usd` from the `clients` table by
>    passing it into the budget guard instead of the static fallback in
>    `lib/llm/budget.ts`.
> 5. Add a Vitest test asserting that the feedback route never withholds the
>    Google URL and that the landing page renders the Google CTA for ratings 1–5.
>    This test is the compliance regression guard — it must fail if anyone later
>    gates the link.
> 6. Write a short `/onboard` admin form to insert a client + render its QR.
>
> Use the kit's slash commands (`/security-scan`, `/quality-gate`) before finishing.
