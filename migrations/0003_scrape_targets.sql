-- ============================================================================
-- 0003_scrape_targets.sql
-- DB-backed competitor scrape targets, replacing the hardcoded list in
-- agents/config.js so the admin Auto-Add page can manage them.
-- Idempotent -- safe to re-run.
-- ============================================================================

create table if not exists scrape_targets (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references sites(id) on delete cascade,
  domain              text not null,
  store_page_pattern  text not null,   -- substring/regex matched against Firecrawl map URLs
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (site_id, domain)
);

alter table scrape_targets enable row level security;
-- No public policy: admin (service-role) and the agents/ script (service-role) only.
