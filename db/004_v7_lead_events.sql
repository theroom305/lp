create table if not exists lead_events (
  id bigserial primary key,
  lead_submission_id text references lead_submissions(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead_id
  on lead_events(lead_submission_id);

create index if not exists idx_lead_events_type_created
  on lead_events(event_type, created_at);
