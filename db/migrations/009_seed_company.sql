-- 009_seed_company.sql
-- Seed company_info, leadership, and partnership data from provided document (only where specified)

-- Company info (use ON CONFLICT to avoid duplicates)
insert into company_info (id, name_en, founded_date, tagline_en, slogan_en, short_description_en, about_en, published)
values (
  gen_random_uuid(),
  'Asterot Bangladesh Limited',
  '2025-03-01',
  'Igniting Tomorrow''s Leaders',
  'Awaken Greatness',
  'Asterot Bangladesh Limited is an event-focused company that organizes professional events, sports events, corporate events, tournaments, gatherings, conferences, entertainment programs, branding/marketing activities, and other event-management services.',
  'Not provided',
  true
)
on conflict (id) do nothing;

-- Leadership seed (names provided by document). Biographies intentionally left empty because document does not provide them.
insert into leadership (id, name, position, display_order)
values
  (gen_random_uuid(), 'Jaky All Naiem Jihan', 'Chairman', 1),
  (gen_random_uuid(), 'Sahadat Hosen Sakib', 'Managing Director', 2),
  (gen_random_uuid(), 'Abu Jakareia Apu', 'Director', 3),
  (gen_random_uuid(), 'Faysal Mahmud', 'Director', 4),
  (gen_random_uuid(), 'Abu Sayed Noman', 'Director', 5),
  (gen_random_uuid(), 'Al-Ebne Noman', 'Director', 6)
on conflict (id) do nothing;

-- Partnerships: include Orion Group as identified in the source document
insert into partnerships (id, partner_name, partnership_type, project_event, description, created_at)
values (
  gen_random_uuid(),
  'Orion Group',
  'sponsorship',
  'Student Uprising Memorial Cup Tournament',
  'Gold sponsor for the Student Uprising Memorial Cup Tournament (as specified in the source document).',
  now()
)
on conflict (id) do nothing;
