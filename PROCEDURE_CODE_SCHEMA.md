# Dentara Procedure Code and Treatment Planning Schema

This schema is designed for a licensed procedure-code import workflow. The repository includes only a small demo seed; production billing should import the practice's licensed dental code source, payer rules, fee schedules, and written compliance approvals.

```sql
create table code_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  effective_date date not null,
  expiration_date date,
  source text not null check (source in ('demo', 'licensed-import')),
  imported_by uuid,
  imported_at timestamptz not null default now(),
  checksum text not null,
  locked_at timestamptz
);

create table procedure_categories (
  id uuid primary key default gen_random_uuid(),
  code_version_id uuid not null references code_versions(id),
  name text not null,
  sort_order integer not null default 0
);

create table procedure_codes (
  id uuid primary key default gen_random_uuid(),
  code_version_id uuid not null references code_versions(id),
  category_id uuid references procedure_categories(id),
  code text not null,
  official_description text not null,
  plain_english_description text not null,
  active boolean not null default true,
  effective_date date not null,
  retirement_date date,
  replacement_code text,
  requires_tooth boolean not null default false,
  requires_surface boolean not null default false,
  allowed_scopes text[] not null default array['tooth'],
  default_fee_cents integer not null default 0,
  synonyms text[] not null default '{}',
  required_clinical_evidence text[] not null default '{}',
  attachments_required text[] not null default '{}',
  payer_review_risk text not null default 'Low',
  preauth_recommended boolean not null default false,
  narrative_recommended boolean not null default false,
  unique (code_version_id, code)
);

create table procedure_tooth_rules (
  id uuid primary key default gen_random_uuid(),
  procedure_code_id uuid not null references procedure_codes(id),
  valid_dentitions text[] not null,
  valid_surfaces text[] not null,
  valid_scopes text[] not null,
  tooth_required boolean not null default false,
  surface_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table procedure_fee_schedules (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null,
  location_id uuid,
  payer_id uuid,
  procedure_code_id uuid not null references procedure_codes(id),
  fee_cents integer not null,
  effective_date date not null,
  expiration_date date,
  created_at timestamptz not null default now(),
  unique (practice_id, location_id, payer_id, procedure_code_id, effective_date)
);

create table insurance_rules (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null,
  plan_id uuid,
  procedure_code_id uuid references procedure_codes(id),
  rule_type text not null,
  rule_payload jsonb not null,
  priority integer not null default 100,
  effective_date date not null,
  expiration_date date,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table treatment_plan_items (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  provider_id uuid not null,
  appointment_id uuid,
  procedure_code_id uuid not null references procedure_codes(id),
  procedure_code_version_id uuid not null references code_versions(id),
  notation_system text not null check (notation_system in ('Universal', 'Palmer', 'FDI')),
  dentition text not null check (dentition in ('Adult', 'Pediatric')),
  tooth_number text,
  surfaces text[] not null default '{}',
  scope text not null,
  quadrant text,
  arch text,
  status text not null,
  fee_cents integer not null default 0,
  insurance_estimate_cents integer not null default 0,
  patient_estimate_cents integer not null default 0,
  clinical_notes text not null default '',
  documentation_requirements text[] not null default '{}',
  attachments uuid[] not null default '{}',
  claim_readiness_score integer not null default 0,
  provider_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended production gates:

- Lock imported code versions after clinical/billing review.
- Store official descriptions only from a licensed source.
- Require provider review before AI-suggested items become billable claim lines.
- Keep payer rules explainable and auditable, with effective dates.
- Treat claim-readiness scores as workflow guidance, not a payment guarantee.
