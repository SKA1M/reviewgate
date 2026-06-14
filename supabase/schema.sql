-- ReviewGate schema
-- =============================================================================
-- COMPLIANCE NOTE (read before touching this file):
-- This schema deliberately does NOT, and MUST NOT, store anything that gates
-- access to Google by sentiment. Every customer is shown the public Google
-- review link regardless of the star value they tap. The `rating` column below
-- exists ONLY to (a) let owners read private feedback and (b) choose helper
-- copy. It is never used to decide who can reach Google. Do not add a column
-- or query that filters the Google CTA by rating.
-- =============================================================================

-- Each client business you onboard (a restaurant, hostel, etc.)
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- used in the QR URL: /r/<slug>
  name          text not null,
  google_review_url text not null,             -- the business's public Google review link
  -- Per-client daily LLM spend cap (USD). Reuses the kit's budget guard, but
  -- keyed to the CLIENT, not an end user — it protects YOUR Anthropic bill.
  daily_llm_budget_usd numeric not null default 1.0,
  created_at    timestamptz not null default now()
);

-- Private feedback captured at the QR landing page.
-- A row is written for EVERY submission. The Google link is shown to all;
-- this table just records what (if anything) the customer typed privately.
create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  rating        smallint check (rating between 1 and 5),  -- nullable: tapping a star is optional
  comment       text,
  -- did the customer also proceed to the public Google link? (best-effort UX signal)
  tapped_google boolean not null default false,
  -- AI-suggested private reply for the owner (themes / suggested response).
  ai_owner_note text,
  created_at    timestamptz not null default now()
);

create index if not exists feedback_client_idx on feedback(client_id, created_at desc);

-- LLM usage table required by the starter kit's lib/llm/usage.ts.
-- Metadata only — never prompt/response content.
create table if not exists llm_usage (
  id             bigint generated always as identity primary key,
  user_id        text not null,        -- we store the client slug here (the "tenant")
  model          text not null,
  input_tokens   integer not null,
  output_tokens  integer not null,
  cache_read_tokens integer not null default 0,
  cost_usd       numeric not null,
  routed_reason  text,
  created_at     timestamptz not null default now()
);

create index if not exists llm_usage_user_day_idx
  on llm_usage(user_id, created_at);

-- View the kit reads to seed the budget guard with today's spend.
create or replace view llm_usage_today as
select user_id, sum(cost_usd) as spend_usd
from llm_usage
where created_at >= date_trunc('day', now() at time zone 'utc')
group by user_id;
