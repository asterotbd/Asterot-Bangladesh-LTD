-- 027_fix_assign_user_role_rpc.sql
-- Fix assign_user_role() authorization boundary.
--
-- The application layer already enforces roles.manage.
-- The previous in-function super_admin check was an obsolete
-- defense-in-depth requirement that prevented valid Administrator
-- role assignment flows. Keep actor identity validation and all
-- role/user/integrity checks intact.

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
  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'USER_NOT_FOUND';
  end if;

  -- Role must exist and be one of the five system roles.
  select r.id, r.name
  into v_role_row_id, v_role_name
  from public.roles r
  where r.id = role_id;

  if v_role_row_id is null
     or v_role_name not in (
       'super_admin',
       'admin',
       'editor',
       'coach',
       'finance'
     ) then
    raise exception 'ROLE_NOT_FOUND';
  end if;

  -- Prevent duplicate assignments (the unique constraint is the backstop).
  if exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role_id = v_role_row_id
  ) then
    raise exception 'DUPLICATE';
  end if;

  insert into public.user_roles (
    user_id,
    role_id,
    assigned_by,
    created_at
  )
  values (
    target_user_id,
    v_role_row_id,
    v_actor,
    now()
  )
  returning id into v_assignment_id;

  -- Transactional audit: if this insert fails, the assignment is rolled back.
  insert into public.audit_logs (
    actor_id,
    action,
    resource,
    resource_id,
    meta,
    created_at
  )
  values (
    v_actor,
    'user_roles.assign',
    'user_roles',
    v_assignment_id,
    jsonb_build_object(
      'role', v_role_name,
      'target_user', target_user_id::text
    ),
    now()
  );

  return v_assignment_id;

exception
  when unique_violation then
    raise exception 'DUPLICATE';
end;
$$;