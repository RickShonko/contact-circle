-- Run this whole file once in Supabase: SQL Editor > New query > paste > Run.
-- Safe to re-run: it only creates things that don't exist yet.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------
create table if not exists contacts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null unique check (phone ~ '^254[17][0-9]{8}$'),
  pin_hash      text not null,
  verified      boolean not null default false,
  downloaded    boolean not null default false,
  downloaded_at timestamptz,
  consented_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists contacts_created_at_idx on contacts (created_at desc);

-- A single-row table (id is always 1).
create table if not exists settings (
  id                int primary key default 1 check (id = 1),
  capacity          int not null default 500 check (capacity > 0),
  registration_open boolean not null default true,
  file_released     boolean not null default false
);

insert into settings (id) values (1) on conflict (id) do nothing;

create table if not exists rate_limits (
  key          text primary key,
  hits         int not null,
  window_start timestamptz not null
);

-- ---------------------------------------------------------------
-- Lock the tables down.
-- RLS on + no policies = the public (anon) API key can read nothing.
-- Only your server, using the service-role key, can touch this data.
-- ---------------------------------------------------------------
alter table contacts    enable row level security;
alter table settings    enable row level security;
alter table rate_limits enable row level security;

revoke all on table contacts, settings, rate_limits from anon, authenticated;

-- ---------------------------------------------------------------
-- Atomic registration: checks "open" and "capacity" and inserts in one
-- step, so two people can't both grab the last slot.
-- Returns: 'ok' | 'closed' | 'full' | 'duplicate'
-- ---------------------------------------------------------------
create or replace function register_contact(p_name text, p_phone text, p_pin_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  s settings%rowtype;
  n int;
begin
  select * into s from settings where id = 1 for update;

  if not s.registration_open then
    return 'closed';
  end if;

  select count(*) into n from contacts;
  if n >= s.capacity then
    return 'full';
  end if;

  begin
    insert into contacts (name, phone, pin_hash) values (p_name, p_phone, p_pin_hash);
  exception when unique_violation then
    return 'duplicate';
  end;

  return 'ok';
end;
$$;

-- ---------------------------------------------------------------
-- Simple fixed-window rate limiter. Returns true while under the limit.
-- ---------------------------------------------------------------
create or replace function hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits int;
begin
  insert into rate_limits (key, hits, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    hits = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else rate_limits.hits + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else rate_limits.window_start
    end
  returning hits into v_hits;

  -- Occasionally tidy up old rows.
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

-- Only the server (service_role) may call these functions.
revoke execute on function register_contact(text, text, text) from public, anon, authenticated;
revoke execute on function hit_rate_limit(text, int, int)     from public, anon, authenticated;
grant  execute on function register_contact(text, text, text) to service_role;
grant  execute on function hit_rate_limit(text, int, int)     to service_role;
