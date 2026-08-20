# Asterot CMS — RBAC Correction: Remove Hardcoded PROTECTED_SUPER_ADMIN_ID

Scope: the application hardcoded `PROTECTED_SUPER_ADMIN_ID = 13a2c1e6-5ff6-43f1-848a-fc64d29c8b1a` as a "protected Super Admin" even though that user actually holds the `admin` role in the database. This report documents where it was used, what was changed, and the verified security state. No commits, pushes, or deployments were made. No roles or `user_roles` rows were modified.

---

## 1. WHERE PROTECTED_SUPER_ADMIN_ID WAS USED

Application code (grep across `lib/`, `app/`, `components/`):

| File | Use |
|---|---|
| `lib/permissions.ts` | Constant definition: `export const PROTECTED_SUPER_ADMIN_ID = '13a2c1e6-5ff6-43f1-848a-fc64d29c8b1a'` |
| `app/api/admin/user-roles/route.ts` | `DELETE` handler: if `userId === PROTECTED_SUPER_ADMIN_ID` and the removed role is `super_admin`, return 403 "cannot be demoted". Also the `isSuperAdminRole()` helper it depended on. |
| `app/admin/(shell)/users/[id]/page.tsx` | Passed `isProtected={user.id === PROTECTED_SUPER_ADMIN_ID}` to `UserRoleManager`. |
| `components/admin/UserRoleManager.tsx` | `isProtected` prop → disables the Remove button for that user's `super_admin` role and shows "The primary Super Admin account cannot be demoted." |

Non-code: the constant was referenced in the historical `PART5_REPORT.md` and `PART5_MIGRATION_APPLY_REPORT.md` (point-in-time docs; this report supersedes those claims).

No migration SQL and no other code hardcoded any user UUID (grep for the UUIDs and for OWN/LAST-super-admin logic returned nothing outside the reports above).

## 2. WHAT WAS CHANGED

The database role is now the sole source of truth for super-admin status (it already was for all authorization — `lib/auth.ts` resolves roles from `user_roles`/`roles`). The incorrect app-level hardcoding was removed entirely:

- **`lib/permissions.ts`** — deleted the `PROTECTED_SUPER_ADMIN_ID` constant and its comment. No replacement UUID is hardcoded.
- **`app/api/admin/user-roles/route.ts`** — removed the import, the `isSuperAdminRole()` helper, and the hardcoded demotion block in `DELETE`. Role removal now goes straight through the atomic `remove_user_role` RPC (migration 015), which enforces the OWN/LAST-super-admin invariants at the database.
- **`app/admin/(shell)/users/[id]/page.tsx`** — removed the import and the `isProtected` prop.
- **`components/admin/UserRoleManager.tsx`** — removed the `isProtected` prop and its `isProtectedSuperAdmin` logic/messaging. Only the self-protection remains: a user cannot remove their **own** `super_admin` role (UI disables it, RPC enforces `OWN_SUPER_ADMIN`).

Authorization was not weakened:
- `roles.manage` remains granted only to `super_admin` at the application layer (`ROLE_PERMISSIONS`), enforced server-side on every call by `requireApiPermission('roles.manage')` → 401/403.
- The RPCs `assign_user_role`/`remove_user_role` remain the only mutation path; they derive the actor from `auth.uid()`, re-check the actor holds `super_admin`, and enforce self-demotion (`OWN_SUPER_ADMIN`) and last-super-admin (`LAST_SUPER_ADMIN`) with row locks.
- The DB trigger `user_roles_protect_last_super_admin` (migration 022) is unchanged and intact.

## 3. DATABASE ROLES ARE UNCHANGED

Verified via SQL (`user_roles` × `roles` × `auth.users`), before and after all tests — identical:

- `c17a04be-e3cf-4a60-87b8-721fbf4f7fc5` — jakyallnaiem@gmail.com — **super_admin**
- `13a2c1e6-5ff6-43f1-848a-fc64d29c8b1a` — mdfaysalmahmud3@gmail.com — **admin**

Assignment counts: `super_admin` = 1, `admin` = 1, `coach`/`editor`/`finance` = 0. No roles or `user_roles` rows were created, changed, or deleted. The protected user was **not** promoted.

## 4. EXACTLY ONE SUPER ADMIN REMAINS

`SELECT count(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'super_admin'` → **1** (c17a04be…). Confirmed after all tests.

## 5. LAST-SUPER-ADMIN PROTECTION STILL WORKS

Tested live against the hosted database via the actual RBAC system (all tests were no-op failures — no data changed):

1. **DB trigger (migration 022):** `DELETE` of the last `super_admin` assignment (single-statement attempt) → `ERROR P0001: LAST_SUPER_ADMIN` raised by `prevent_removing_last_super_admin()`; the statement aborted and the assignment is intact. Even a direct SQL delete cannot remove the final super admin.
2. **RPC (migration 015):** `remove_user_role(...)` invoked without a real user session (service-role path, `auth.uid()` null) → `ERROR P0001: UNAUTHENTICATED`; the mutation is impossible without an authenticated super-admin session. No bypass path exists.
3. **Trigger presence:** `user_roles_protect_last_super_admin` confirmed on `user_roles`.
4. **App-layer:** with the hardcoded block removed, removal of a super admin now flows exclusively through the RPC, so `LAST_SUPER_ADMIN` / `OWN_SUPER_ADMIN` are enforced at the database for every caller (including the current single super admin c17a04be…, which therefore cannot be removed or demoted).

## 6. TYPESCRIPT / LINT / BUILD

- `npx tsc --noEmit` → **exit 0, no errors**
- `npm run lint` → **exit 0, "No ESLint warnings or errors"**
- `npm run build` → **exit 0**

---

*Nothing was committed, pushed, or deployed. No database roles or user_roles were modified. No credentials printed.*