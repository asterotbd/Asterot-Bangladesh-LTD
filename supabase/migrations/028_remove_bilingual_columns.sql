-- 028_remove_bilingual_columns.sql
--
-- Removes the dormant bilingual (Bangla) content layer. The site ships a
-- single language, and the application code now reads only the `_en` columns,
-- which are left completely untouched by this migration.
--
-- Before running, the only `_bn` value holding content anywhere in the
-- database was events.description_bn = 'hudai' on the test event
-- 1ec77417-9ea7-4f0e-a669-49406b90b8a7. Every other `_bn` column was null or
-- empty across all rows. See db/backups/028_bilingual_data_backup.sql for the
-- captured values and a restore path.
--
-- The column drop is driven off information_schema rather than a hand-written
-- list so that tables which were empty (and therefore invisible to an API
-- probe) are covered too: categories, projects, portfolio_items,
-- corporate_services, sponsors, partners and leadership all carry `_bn`
-- columns in addition to the tables the app queries directly.

begin;

do $$
declare
  r record;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.column_name like '%\_bn'
    order by c.table_name, c.column_name
  loop
    raise notice 'dropping %.%', r.table_name, r.column_name;
    execute format('alter table public.%I drop column if exists %I', r.table_name, r.column_name);
  end loop;
end $$;

-- Key/locale/value translation store. Never referenced by the application at
-- any point; dropped with the rest of the bilingual layer.
drop table if exists public.translations;

commit;

-- Verification: both queries should return zero rows.
--
--   select table_name, column_name
--   from information_schema.columns
--   where table_schema = 'public' and column_name like '%\_bn';
--
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_name = 'translations';
