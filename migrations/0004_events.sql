-- ============================================================================
-- 0004_events.sql
-- Event / seasonal landing pages (Black Friday, Soldes, Rentrée...) and the
-- stores assigned to them. Per-site like everything else. Idempotent.
-- ============================================================================

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references sites(id) on delete cascade,
  name         text not null,
  slug         text not null,
  description  text,
  is_active    boolean not null default true,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists event_stores (
  event_id   uuid not null references events(id) on delete cascade,
  store_id   uuid not null references stores(id) on delete cascade,
  site_id    uuid not null references sites(id) on delete cascade,
  primary key (event_id, store_id)
);

create index if not exists idx_event_stores_store on event_stores (store_id);

alter table events enable row level security;
drop policy if exists "public read active events" on events;
create policy "public read active events" on events for select using (is_active = true);

alter table event_stores enable row level security;
drop policy if exists "public read event_stores" on event_stores;
create policy "public read event_stores" on event_stores for select using (true);
