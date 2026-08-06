-- 011_contact_messages_organization.sql
-- The contact form (lib/contact.ts) submits an `organization` field.
-- Add the column to contact_messages so inserts don't fail.

alter table contact_messages
  add column if not exists organization text;
