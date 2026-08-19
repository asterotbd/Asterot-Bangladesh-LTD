-- 016_rate_limiting.sql
-- Distributed rate limiting backed by Postgres.
--
-- The app runs on stateless serverless functions, so per-instance in-memory
-- counters would be trivially bypassed (cold starts, instance rotation). This
-- migration provides a shared, atomic rate limiter in the existing Supabase
-- database instead.
--
-- Design:
--   * A single atomic upsert (INSERT ... ON CONFLICT) performs the
--     "check-and-record-attempt" in one statement. Concurrent requests for the
--     same key are serialized on the primary-key row lock, so the counter can
--     never overrun the configured maximum.
--   * Windows slide: each row carries a window_start timestamp. When a request
--     arrives after the window has expired, the counter resets to 1 instead of
--     extending the old window. Expired rows are pruned opportunistically on
--     each consume call.
--   * The RPC is SECURITY DEFINER with a pinned search_path so it can write to
--     the rate_limits table regardless of the caller's role.
--   * EXECUTE is granted to service_role only. Browser clients and the
--     user-scoped server client cannot invoke it, so it cannot be abused
--     through direct Supabase access. The application calls it with the
--     service-role client from lib/rate-limit.ts.
--   * RLS is enabled with no policies, so anon/authenticated have no table
--     access. The SECURITY DEFINER owner (and service_role) bypass RLS.
--
-- Limitations (intentional, documented):
--   * This is a best-effort application guard, not a substitute for edge
--     WAF/anti-bot rules.
--   * Login attempts are NOT counted here: the sign-in call goes directly from
--     the browser to Supabase Auth (GoTrue), which applies its own built-in
--     rate limits. Routing login through this project's API would be required
--     to add an additional app-level limiter on top.
--   * The application fails OPEN: if the database is unreachable, the limiter
--     logs the error and allows the request, so a transient DB outage never
--     locks everyone out of sign-ins or mutations.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.rate_limits enable row level security;

create or replace function public.rate_limit_consume(
  p_key text,
  p_window_seconds int,
  p_max integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_cutoff timestamptz := now() - make_interval(secs => p_window_seconds);
  v_count integer;
begin
  if p_key is null or p_key = '' or p_window_seconds <= 0 or p_max < 0 then
    raise exception 'INVALID_RATE_LIMIT_ARGS';
  end if;

  -- Opportunistic pruning of expired windows (best-effort housekeeping).
  delete from public.rate_limits where window_start < v_cutoff;

  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
  set count = case
        when rl.window_start < v_cutoff then 1
        else rl.count + 1
      end,
      window_start = case
        when rl.window_start < v_cutoff then v_now
        else rl.window_start
      end
  returning rl.count into v_count;

  return v_count <= p_max;
end;
$$;

-- Only the service-role server client may consume rate-limit budget.
revoke execute on function public.rate_limit_consume(text, int, int) from public;
grant execute on function public.rate_limit_consume(text, int, int) to service_role;

-- Keep anon/authenticated away from the table entirely.
revoke all on table public.rate_limits from anon, authenticated;