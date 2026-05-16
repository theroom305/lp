create table if not exists lead_submissions (
  id text primary key,
  idempotency_key text not null unique,
  payload jsonb not null,
  score jsonb not null,
  tier text not null,
  stage text not null,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
