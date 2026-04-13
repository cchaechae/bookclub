-- Run in Supabase SQL Editor after supabase_schema.sql (book_clubs).
-- Identity + persisted onboarding chat + profiles linked to users.

-- ── App users (email identity; no password — dev / personal project pattern) ──
create table if not exists public.bookclub_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint bookclub_users_email_nonempty check (length(trim(email)) > 0)
);

create index if not exists bookclub_users_created_at_idx
  on public.bookclub_users (created_at desc);

-- ── Saved reading profiles (embeddings for future semantic match) ───────────
-- Base table without user_id first so "IF NOT EXISTS" is safe even if an older
-- version of this file already created user_profiles without user_id.
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  preferred_genres jsonb not null default '[]'::jsonb,
  reading_goal text not null default '',
  cadence text not null default '',
  freetext text not null default '',
  embedding jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists user_id uuid references public.bookclub_users (id) on delete set null;

create index if not exists user_profiles_user_id_idx on public.user_profiles (user_id);

-- ── Onboarding chat (survives uvicorn restarts; one row per client session id) ─
create table if not exists public.chat_sessions (
  id uuid primary key,
  user_id uuid not null references public.bookclub_users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  profile_id uuid references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_sessions_status_chk check (status in ('active', 'completed'))
);

create index if not exists chat_sessions_user_id_idx on public.chat_sessions (user_id);
create index if not exists chat_sessions_updated_at_idx on public.chat_sessions (updated_at desc);

alter table public.bookclub_users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.chat_sessions enable row level security;
