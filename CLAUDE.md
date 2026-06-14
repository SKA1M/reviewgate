# ReviewGate
Next.js (App Router) + TypeScript + Supabase. Vendored cost-aware Anthropic
client in src/lib/llm — configure it, don't rewrite it.

## Hard rule — do not violate
The Google review CTA in src/app/r/[slug]/FeedbackClient.tsx must render for
EVERY guest regardless of star rating. Never wrap it in a rating condition.
This is legal compliance (Google review-gating policy + FTC), not a preference.

## After every change
Run npm run typecheck.
