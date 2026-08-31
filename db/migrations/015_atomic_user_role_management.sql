-- 015_atomic_user_role_management.sql
-- Stage 5E: move critical role-management invariants into the database.
--
-- This migration:
--   1. Creates SECURITY DEFINER functions assign_user_role() and
--      remove_user_role() that perform the entire role mutation plus a
--      transactional audit insert atomically.
--   2. Makes the last-super-admin removal check atomic via a row lock on the
--      super_admin role row, so concurrent removals can never leave the
--      database with zero super_admin assignments (no count -> delete ->
--      recount -> restore).
--   3. Hardens RLS:
--        * user_roles : browser clients may SELECT only their own rows;
--                       direct INSERT/UPDATE/DELETE are denied.
--        * roles     : read-only reference data for authenticated users;
--                       direct writes are denied (RLS newly enabled).
--        * profiles  : privileged direct browser writes removed; self
--                       read/write preserved.
--        * audit_logs: no anon/authenticated access at all (RLS newly
--                       enabled); the only writer is the RPC (SECURITY
--                       DEFINER) / service-role server client.
--   4. Revokes unnecessary table privileges from anon/authenticated and
--      makes function execute grants explicit.
--
-- Security notes:
--   * The functions derive the actor from auth.uid() and never trust a
--     client-supplied actor. The supplied actor_id (if any) must match.
--   * The permission matrix stays in lib/permissions.ts (application layer).
--     The in-function super_admin check is defense-in-depth only.
--   * All table references are schema-qualified and search_path is pinned to
--     public to prevent function hijacking.
--   * A failed audit insert aborts the whole transaction (the assignment
--     insert/delete is rolled back automatically).

-- ===========================================================================
-- 1. Atomic role-assignment function
-- ===========================================================================

create or replace function public.assign_user_role(
  target_user_id uuid,
  role_id uuid,
  actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role_row_id uuid;
  v_role_name text;
  v_assignment_id uuid;
begin
  -- Actor identity: must be an authenticated session.
  if v_actor is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  -- If an actor_id is supplied, it must match the session actor.
  if actor_id is distinct from v_actor then
    raise exception 'ACTOR_MISMATCH';
  end if;

  -- Target user must exist in auth.users.
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  -- Role must exist and be one of the five system roles.
  select r.id, r.name into v_role_row_id, v_role_name
  from public.roles r
  where r.id = role_id;
  if v_role_row_id is null or v_role_name not in ('super_admin', 'admin', 'editor', 'coach', 'finance') then
    raise exception 'ROLE_NOT_FOUND';
  end if;

  -- Prevent duplicate assignments (the unique constraint is the backstop).
  if exists (
    select 1
    from public.user_roles
    where user_id = target_user_id and role_id = v_role_row_id
  ) then
    raise exception 'DUPLICATE';
  end if;

  insert into public.user_roles (user_id, role_id, assigned_by, created_at)
  values (target_user_id, v_role_row_id, v_actor, now())
  returning id into v_assignment_id;

  -- Transactional audit: if this insert fails, the assignment is rolled back.
  insert into public.audit_logs (actor_id, action, resource, resource_id, meta, created_at)
  values (
    v_actor,
    'user_roles.assign',
    'user_roles',
    v_assignment_id,
    jsonb_build_object('role', v_role_name, 'target_user', target_user_id::text),
    now()
  );

  return v_assignment_id;
exception
  when unique_violation then
    raise exception 'DUPLICATE';
end;
$$;

-- ===========================================================================
-- 2. Atomic role-removal function (with last-super-admin locking)
-- ===========================================================================

create or replace function public.remove_user_role(
  target_user_id uuid,
  role_id uuid,
  actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role_row_id uuid;
  v_role_name text;
  v_assignment_id uuid;
  v_super_admin_role_id uuid;
  v_super_admin_count integer;
begin
  -- Actor identity: must be an authenticated session.
  if v_actor is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  -- If an actor_id is supplied, it must match the session actor.
  if actor_id is distinct from v_actor then
    raise exception 'ACTOR_MISMATCH';
  end if;

  -- Defense-in-depth authorization: actor must currently hold super_admin.
  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = v_actor and r.name = 'super_admin'
  ) then
    raise exception 'UNAUTHORIZED';
  end if;

  -- Target user must exist in auth.users.
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  -- Role must exist and be one of the five system roles.
  select r.id, r.name into v_role_row_id, v_role_name
  from public.roles r
  where r.id = role_id;
  if v_role_row_id is null or v_role_name not in ('super_admin', 'admin', 'editor', 'coach', 'finance') then
    raise exception 'ROLE_NOT_FOUND';
  end if;

  -- Lock the assignment row so concurrent removals of the same assignment
  -- are serialized (the second caller observes NOT_ASSIGNED).
  select ur.id into v_assignment_id
  from public.user_roles ur
  where ur.user_id = target_user_id and ur.role_id = v_role_row_id
  for update;

  if v_assignment_id is null then
    raise exception 'NOT_ASSIGNED';
  end if;

  if v_role_name = 'super_admin' then
    -- Self-protection: an actor cannot remove their own super admin role.
    if target_user_id = v_actor then
      raise exception 'OWN_SUPER_ADMIN';
    end if;

    -- Last-super-admin protection: serialize every super-admin removal on
    -- the system role row so that only one transaction can decide at a time.
    -- The lock is held until this transaction commits or rolls back.
    select r.id into v_super_admin_role_id
    from public.roles r
    where r.name = 'super_admin'
    for update;

    if v_super_admin_role_id is null then
      raise exception 'ROLE_NOT_FOUND';
    end if;

    select count(*) into v_super_admin_count
    from public.user_roles ur
    where ur.role_id = v_super_admin_role_id;

    if v_super_admin_count <= 1 then
      raise exception 'LAST_SUPER_ADMIN';
    end if;
  end if;

  delete from public.user_roles where id = v_assignment_id;

  -- Transactional audit: if this insert fails, the removal is rolled back.
  insert into public.audit_logs (actor_id, action, resource, resource_id, meta, created_at)
  values (
    v_actor,
    'user_roles.remove',
    'user_roles',
    v_assignment_id,
    jsonb_build_object('role', v_role_name, 'target_user', target_user_id::text),
    now()
  );
exception
  when unique_violation then
    raise exception 'DUPLICATE';
end;
$$;

-- ===========================================================================
-- 3. RLS hardening
-- ===========================================================================

-- user_roles: browser/user-scoped clients may only read their own
-- assignments (keeps user_has_role() working inside existing policies).
-- Direct browser INSERT/UPDATE/DELETE are denied by having no such policy.
drop policy if exists "user_roles_super_admin" on public.user_roles;
drop policy if exists "user_roles_self_select" on public.user_roles;
create policy "user_roles_self_select" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

-- roles: enable RLS; read-only reference data for authenticated users.
-- No browser path may INSERT/UPDATE/DELETE roles.
alter table public.roles enable row level security;
drop policy if exists "roles_read_authenticated" on public.roles;
create policy "roles_read_authenticated" on public.roles
  for select to authenticated
  using (true);

-- profiles: keep self read/write; remove direct privileged browser writes.
-- Privileged profile updates continue through PUT /api/admin/users/[id]
-- using the server-side service-role client.
drop policy if exists "profiles_admin_manage" on public.profiles;

-- audit_logs: enable RLS with no policies, so anon/authenticated have no
-- access. The only writer is the SECURITY DEFINER RPC (or the service-role
-- server client, which bypasses RLS).
alter table public.audit_logs enable row level security;

-- ===========================================================================
-- 4. Grants hardening
-- ===========================================================================

-- user_roles: authenticated keeps SELECT (own rows via RLS); no direct writes.
revoke insert, update, delete on table public.user_roles from anon, authenticated;

-- roles: authenticated keeps SELECT (reference data); no direct writes.
revoke insert, update, delete on table public.roles from anon, authenticated;

-- profiles: authenticated keeps SELECT + UPDATE for self read/write;
-- no direct INSERT/DELETE (rows are created by the signup trigger).
revoke insert, delete on table public.profiles from anon, authenticated;

-- audit_logs: no anon/authenticated access whatsoever.
revoke all on table public.audit_logs from anon, authenticated;

-- Functions: replace the implicit PUBLIC execute grant with explicit grants.
-- anon may invoke (the functions themselves reject unauthenticated callers);
-- authenticated is the normal caller (the user-scoped server client); and
-- service_role is kept for server-side flexibility.
revoke execute on function public.assign_user_role(uuid, uuid, uuid) from public;
revoke execute on function public.remove_user_role(uuid, uuid, uuid) from public;
grant execute on function public.assign_user_role(uuid, uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.remove_user_role(uuid, uuid, uuid) to anon, authenticated, service_role;