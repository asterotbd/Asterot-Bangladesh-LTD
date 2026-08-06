-- 006_rls_and_policies.sql
-- Enable RLS and create policies for tables containing user/private data.

-- helper: check role
create or replace function public.user_has_role(uid uuid, role_name text) returns boolean as $$
  select exists(
    select 1 from user_roles ur join roles r on ur.role_id = r.id where ur.user_id = uid and r.name = role_name
  );
$$ language sql stable;

-- Enable RLS on tables that require it
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table academy_applications enable row level security;
alter table academy_reviews enable row level security;
alter table registrations enable row level security;
alter table payments enable row level security;
alter table contact_messages enable row level security;
alter table notifications enable row level security;

-- Profiles: users can select/update their own profile
create policy "profiles_self_read" on profiles
  for select using ( auth.uid() = id );

create policy "profiles_self_write" on profiles
  for update using ( auth.uid() = id );

-- Allow admins to manage profiles
create policy "profiles_admin_manage" on profiles
  for all using ( public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') ) with check ( public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );

-- user_roles: only super_admin can manage
create policy "user_roles_super_admin" on user_roles
  for all using ( public.user_has_role(auth.uid(), 'super_admin') ) with check ( public.user_has_role(auth.uid(), 'super_admin') );

-- Academy applications: owner can insert/select/update (but not change status to accepted without review)
create policy "academy_insert_own" on academy_applications
  for insert with check ( auth.uid() = user_id );

create policy "academy_select_own" on academy_applications
  for select using ( auth.uid() = user_id or public.user_has_role(auth.uid(), 'coach') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );

create policy "academy_update_owner" on academy_applications
  for update using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- Academy reviews: coaches and admins
create policy "academy_reviews_team" on academy_reviews
  for all using ( public.user_has_role(auth.uid(), 'coach') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') ) with check ( public.user_has_role(auth.uid(), 'coach') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );

-- registrations/payments: owners and finance/admin
create policy "registrations_owner_or_staff" on registrations
  for select using ( auth.uid() = user_id or public.user_has_role(auth.uid(), 'finance') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );

create policy "registrations_insert_authenticated" on registrations
  for insert with check ( auth.uid() = user_id );

create policy "payments_owner_or_finance" on payments
  for select using ( auth.uid() = user_id or public.user_has_role(auth.uid(), 'finance') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );

create policy "payments_update_finance" on payments
  for update using ( public.user_has_role(auth.uid(), 'finance') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') ) with check ( public.user_has_role(auth.uid(), 'finance') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );

-- contact messages: public insert, admin select/manage
create policy "contact_insert_public" on contact_messages
  for insert with check ( true );

create policy "contact_admin_manage" on contact_messages
  for select using ( public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'super_admin') );
