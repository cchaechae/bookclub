-- Run in Supabase SQL Editor (once) before using the app.
-- Table for user-created book clubs (replaces static seed data for runtime reads).

create table if not exists public.book_clubs (
  id uuid primary key default gen_random_uuid(),
  leader text not null,
  genre text not null,
  book_title text not null,
  book_summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists book_clubs_genre_idx on public.book_clubs (genre);
create index if not exists book_clubs_created_at_idx on public.book_clubs (created_at desc);

alter table public.book_clubs enable row level security;

-- Service role bypasses RLS; if you add anon key from the client later, add policies here.

-- Onboarding chat persistence + email identity + user_profiles:
--   also run server/supabase_onboarding_auth.sql in the SQL Editor.
