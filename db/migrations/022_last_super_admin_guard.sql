-- 022_last_super_admin_guard.sql
-- Belt-and-suspenders for the super-admin invariants.
--
-- Migration 015 moved role mutations into SECURITY DEFINER functions
-- (assign_user_role / remove_user_role) with self-demotion and
-- last-super-admin protections. Those protections only run when a role
-- mutation goes through the RPC.
--
-- This migration adds a database trigger so that NO code path -- including a
-- direct SQL DELETE or a cascade delete of an auth.users row (profiles /
-- user_roles both cascade) -- can leave the system with zero super_admin
-- assignments. The trigger serializes on the super_admin role row, matching
-- the lock taken inside remove_user_role(), so concurrent attempts cannot
-- race past the check.

create or replace function public.prevent_removing_last_super_admin()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_remaining integer;
begin
  -- Only super_admin assignments are constrained; other role removals pass.
  if exists (
    select 1 from public.roles r
    where r.id = old.role_id and r.name = 'super_admin'
  ) then
    -- Serialize concurrent last-super-admin removals on the role row. The
    -- lock is already held by remove_user_role() in its own transaction, so
    -- acquiring it again here is a no-op in that path.
    perform 1
    from public.roles r
    where r.name = 'super_admin'
    for update;

    -- Count remaining super_admin assignments excluding the row being deleted.
    select count(*) into v_remaining
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where r.name = 'super_admin' and ur.id <> old.id;

    if v_remaining <= 0 then
      raise exception 'LAST_SUPER_ADMIN';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists user_roles_protect_last_super_admin on public.user_roles;

create trigger user_roles_protect_last_super_admin
before delete on public.user_roles
for each row execute function public.prevent_removing_last_super_admin();

-- Remove the helper's PUBLIC execute grant created implicitly.
revoke execute on function public.prevent_removing_last_super_admin() from public;