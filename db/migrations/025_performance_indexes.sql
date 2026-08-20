-- 025_performance_indexes.sql
-- Add missing indexes on frequently filtered / joined columns.
--
-- Rationale (all additive, no behavior change):
--   * user_roles is queried by user_has_role() on every RLS policy evaluation
--     and by the auth flow (lib/auth.ts). It had no index at all.
--   * events.status / news.status drive the admin table filters and the
--     status<->published sync triggers.
--   * events.featured drives the homepage featured-event query.
--   * media.created_at orders the admin media library.
--   * audit_logs is ordered/filtered by the activity screen.
--   * registrations(event_id) backs the public registration duplicate check.
--   * news/events category_id back the admin category filters.

create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role_id);

create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_featured on public.events(featured);
create index if not exists idx_events_category on public.events(category_id);

create index if not exists idx_news_status on public.news(status);
create index if not exists idx_news_category on public.news(category_id);

create index if not exists idx_media_created_at on public.media(created_at desc);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);

create index if not exists idx_registrations_event on public.registrations(event_id);
create index if not exists idx_registrations_user on public.registrations(user_id);