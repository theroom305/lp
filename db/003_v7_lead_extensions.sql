alter table lead_submissions
  add column if not exists customer_state text,
  add column if not exists use_mix text,
  add column if not exists hold_horizon text,
  add column if not exists advisor_involved boolean default false,
  add column if not exists advisor_name text,
  add column if not exists main_concern text,
  add column if not exists lead_tier text,
  add column if not exists atlas_match boolean default false,
  add column if not exists matched_building_slug text;
