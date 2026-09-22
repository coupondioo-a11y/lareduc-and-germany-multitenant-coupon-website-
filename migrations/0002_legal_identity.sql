-- ============================================================================
-- 0002_legal_identity.sql
-- Per-site legal identity fields for Mentions légales / Impressum pages.
-- Idempotent -- safe to re-run.
-- ============================================================================

alter table sites add column if not exists operator_name text;
alter table sites add column if not exists operator_address text;
alter table sites add column if not exists siret text;
alter table sites add column if not exists publication_director text;
alter table sites add column if not exists host_name text;
alter table sites add column if not exists host_address text;
alter table sites add column if not exists dpo_email text;
