-- 023_leadership_publishing.sql
-- Add a published flag to leadership so unpublished rows can never appear on
-- the public About page.
--
-- The leadership table (created in migration 008) had no publishing gate:
-- every row was publicly readable. There is no leadership admin editor today,
-- but defensive consistency requires that any future DB row cannot leak before
-- an admin explicitly publishes it. Existing rows (none are seeded) are treated
-- as unpublished; the public page falls back to the static leadership catalog
-- when no published rows exist.

alter table public.leadership
  add column if not exists published boolean not null default false;

create index if not exists idx_leadership_published on public.leadership(published, display_order);