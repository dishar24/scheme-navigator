-- ============================================================
-- Scheme Navigator — Supabase schema (SIH26092)
-- Run this in your Supabase project's SQL Editor before starting the backend.
-- ============================================================

-- 1. SCHEME RULES (versioned knowledge base)
-- Every edit inserts a new row instead of overwriting — this is what
-- makes the Policy-Change Impact Scanner possible.
create table if not exists scheme_rules (
  id            bigint generated always as identity primary key,
  scheme_id     text not null,              -- 'micro' | 'term' | 'education'
  scheme_name   text not null,
  version       int not null,
  is_current    boolean not null default true,
  income_cap    numeric not null,
  max_project_cost numeric not null,
  funding_pct   numeric not null,
  interest_rate numeric not null,
  moratorium_months int not null,
  documents     jsonb not null default '[]',
  last_verified timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_scheme_rules_current
  on scheme_rules (scheme_id) where is_current = true;

-- 2. CHANNEL PARTNERS
create table if not exists channel_partners (
  id            bigint generated always as identity primary key,
  name          text not null,
  type          text not null,              -- 'SCA' | 'PSB' | 'RRB' | 'NBFC-MFI'
  latitude      numeric,
  longitude     numeric,
  schemes_handled jsonb not null default '[]',  -- e.g. '["micro","term"]'
  npa_status    text not null default 'low',    -- 'low' | 'medium' | 'high'  (MOCKED — see README)
  fund_utilization_pct numeric not null default 80, -- MOCKED — see README
  is_eligible   boolean generated always as
    (npa_status <> 'high' and fund_utilization_pct >= 50) stored
);

-- 3. APPLICANTS (saved profiles — needed for the Policy-Change Scanner)
create table if not exists applicants (
  id            bigint generated always as identity primary key,
  name          text not null,
  income        numeric not null,
  project_cost  numeric not null,
  education_status text not null,
  matched_scheme_id text,
  matched_scheme_version int,
  eligible_at_submission boolean,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Seed data — matches the values used in the demo / PPT
-- ============================================================

insert into scheme_rules (scheme_id, scheme_name, version, income_cap, max_project_cost, funding_pct, interest_rate, moratorium_months, documents)
values
  ('micro', 'Micro Finance Scheme', 1, 500000, 140000, 90, 6.5, 3,
   '["Aadhaar Card","Caste Certificate","Income Certificate","Basic Business Proposal"]'),
  ('term', 'Term Loan Scheme', 1, 500000, 5000000, 90, 7, 6,
   '["Aadhaar Card","Caste Certificate","Income Certificate","Detailed Project Report","Collateral/Guarantor Documents"]'),
  ('education', 'Education Loan Scheme', 1, 500000, 2000000, 90, 6.5, 12,
   '["Aadhaar Card","Caste Certificate","Income Certificate","Admission Letter","Fee Structure Document"]')
on conflict do nothing;

insert into channel_partners (name, type, latitude, longitude, schemes_handled, npa_status, fund_utilization_pct)
values
  ('Canara Bank — SC Cell', 'PSB', 12.9716, 77.5946, '["micro","term","education"]', 'low', 82),
  ('SIDBI SCA Branch', 'SCA', 12.9800, 77.6050, '["term","education"]', 'low', 90),
  ('Regional Rural Bank — North Zone', 'RRB', 12.9950, 77.5700, '["micro","term"]', 'medium', 68),
  ('Uday NBFC-MFI', 'NBFC-MFI', 12.9600, 77.5850, '["micro"]', 'high', 41),
  ('State Channelizing Agency — Dist. Office', 'SCA', 13.0100, 77.6200, '["micro","term","education"]', 'low', 88),
  ('Kaveri NBFC-MFI', 'NBFC-MFI', 12.9450, 77.6000, '["micro","term"]', 'high', 38)
on conflict do nothing;

insert into applicants (name, income, project_cost, education_status, matched_scheme_id, matched_scheme_version, eligible_at_submission)
values
  ('Applicant #101', 480000, 1200000, 'graduate', 'term', 1, true),
  ('Applicant #102', 520000, 800000, 'graduate', 'term', 1, false),
  ('Applicant #103', 550000, 1500000, 'postgraduate', 'term', 1, false),
  ('Applicant #104', 300000, 120000, 'undergraduate', 'micro', 1, true),
  ('Applicant #105', 590000, 3000000, 'graduate', 'term', 1, false)
on conflict do nothing;
