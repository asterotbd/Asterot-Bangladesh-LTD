-- 010_expand_company_seed.sql
-- Conservative expansion of company services and related CMS entries based only on explicit items listed in the source document

-- Insert services only when the exact title does not already exist
insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Event Management', 'Full-service event planning and execution', 'Event planning and end-to-end execution for professional events and gatherings as described in the source document.', 10, true
where not exists (select 1 from services where title_en = 'Event Management');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Sports Events', 'Organization of sports events and tournaments', 'Planning and management of sports events and tournaments as explicitly referenced in the source document.', 20, true
where not exists (select 1 from services where title_en = 'Sports Events');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Concerts & Live Performances', 'Production and management of concerts and live entertainment programs', 'Concert and live performance production for public entertainment programs as listed in the source document.', 30, true
where not exists (select 1 from services where title_en = 'Concerts & Live Performances');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Corporate Events', 'Corporate event planning and delivery', 'Corporate events including conferences, meetings, and branded corporate functions as mentioned in the source document.', 40, true
where not exists (select 1 from services where title_en = 'Corporate Events');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Branding & Marketing', 'Branding, marketing and activation services', 'Branding, marketing activities and activations referenced in the document.', 50, true
where not exists (select 1 from services where title_en = 'Branding & Marketing');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Tournaments', 'Organize and manage tournaments', 'Organization and management of tournaments as explicitly listed in the source document.', 60, true
where not exists (select 1 from services where title_en = 'Tournaments');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Conferences & Gatherings', 'Conferences and large gatherings', 'Planning and execution of conferences and large gatherings mentioned in the source document.', 70, true
where not exists (select 1 from services where title_en = 'Conferences & Gatherings');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Entertainment Programs', 'Public entertainment program production', 'Production of entertainment programs as referenced in the source document.', 80, true
where not exists (select 1 from services where title_en = 'Entertainment Programs');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Corporate Training', 'Corporate training services', 'Corporate training services as listed in the source document.', 90, true
where not exists (select 1 from services where title_en = 'Corporate Training');

insert into services (id, title_en, short_description_en, description_en, display_order, published)
select gen_random_uuid(), 'Strategic Consulting', 'Advisory and strategy services', 'Strategic consulting services referenced by the source document.', 100, true
where not exists (select 1 from services where title_en = 'Strategic Consulting');

-- Ensure a company_info row exists for Asterot Bangladesh Limited without overwriting existing values
insert into company_info (id, name_en, short_description_en, published)
select gen_random_uuid(), 'Asterot Bangladesh Limited', 'Asterot Bangladesh Limited is an event-focused company that organizes professional events, sports events, corporate events, tournaments, gatherings, conferences, entertainment programs, branding/marketing activities, and other event-management services.', true
where not exists (select 1 from company_info where name_en = 'Asterot Bangladesh Limited');
