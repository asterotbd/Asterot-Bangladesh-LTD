-- 018 FAQ publishing workflow
-- Adds a status column (draft | published | archived) to faq, kept in sync with
-- the existing published boolean, mirroring the events/news workflow.
alter table public.faq
  add column if not exists status text not null default 'draft'
  check (status in ('draft', 'published', 'archived'));

update public.faq set status = 'published' where published = true and status = 'draft';

create or replace function public.faq_sync_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    new.published = true;
  elsif new.status = 'draft' or new.status = 'archived' then
    new.published = false;
  end if;
  return new;
end;
$$;

drop trigger if exists faq_sync_status on public.faq;
create trigger faq_sync_status
  before insert or update on public.faq
  for each row
  execute function public.faq_sync_status();