-- 004_academy_registrations_payments.sql
-- Academy applications, reviews, registrations and payments

-- academy applications
do $$
begin
  create type academy_application_status as enum (
    'submitted', 'under_review', 'shortlisted', 'trial', 'accepted', 'rejected'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists academy_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  applicant_name text,
  dob date,
  sport text,
  experience_years int,
  achievements text,
  family_status text,
  financial_notes text,
  media jsonb,
  status academy_application_status default 'submitted',
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger academy_applications_set_updated_at
before update on academy_applications
for each row execute function public.set_updated_at();

-- academy reviews
create table if not exists academy_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references academy_applications(id) on delete cascade,
  reviewer_id uuid references auth.users(id),
  notes text,
  score int,
  evaluation jsonb,
  created_at timestamptz default now()
);

-- registrations
do $$
begin
  create type registration_status as enum('pending','confirmed','cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_id uuid references events(id),
  project_id uuid references projects(id),
  form_data jsonb,
  status registration_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger registrations_set_updated_at
before update on registrations
for each row execute function public.set_updated_at();

-- payments
do $$
begin
  create type payment_status as enum('pending','processing','paid','failed','refunded','cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id) on delete set null,
  user_id uuid references auth.users(id),
  amount numeric(12,2) not null,
  currency text default 'BDT',
  gateway text,
  transaction_id text,
  status payment_status default 'pending',
  gateway_metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger payments_set_updated_at
before update on payments
for each row execute function public.set_updated_at();
