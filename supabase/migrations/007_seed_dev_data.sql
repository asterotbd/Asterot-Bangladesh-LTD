-- 007_seed_dev_data.sql
-- Seed safe development data. Do NOT use for production.

-- Roles
insert into roles (id, name, description) values
  (gen_random_uuid(), 'super_admin', 'Full system access'),
  (gen_random_uuid(), 'admin', 'Content administrator'),
  (gen_random_uuid(), 'editor', 'Content editor'),
  (gen_random_uuid(), 'coach', 'Academy coach'),
  (gen_random_uuid(), 'finance', 'Finance manager')
on conflict (name) do nothing;

-- Categories
insert into categories (id, name_en, name_bn, slug, type) values
  (gen_random_uuid(), 'Sports Events', 'ক্রীড়া', 'sports-events', 'project'),
  (gen_random_uuid(), 'Corporate Events', 'কর্পোরেট', 'corporate-events', 'project')
on conflict (slug) do nothing;

-- Sample Project
insert into projects (id, title_en, slug, summary_en, published, featured) values
  (gen_random_uuid(), 'Sample Project', 'sample-project', 'Sample Project placeholder', true, true)
on conflict (slug) do nothing;

-- Sample News
insert into news (id, title_en, slug, excerpt_en, published) values
  (gen_random_uuid(), 'Sample News', 'sample-news', 'Sample news excerpt', true)
on conflict (slug) do nothing;

-- Sample Event
insert into events (id, title_en, slug, description_en, published) values
  (gen_random_uuid(), 'Sample Event', 'sample-event', 'Sample event description', true)
on conflict (slug) do nothing;
