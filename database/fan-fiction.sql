-- Mila Fan-Fiction community
-- Run this SQL once in the Supabase SQL Editor for project xspibbzwfwhmgvfowiye.
create extension if not exists pgcrypto;
create table if not exists public.fanfiction_posts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null check (char_length(author_name) between 1 and 40),
 story_slug text not null default 'dark-romance',
 title text not null check (char_length(title) between 1 and 120),
 excerpt text not null check (char_length(excerpt) between 1 and 300),
 body text not null check (char_length(body) between 1 and 30000),
 is_published boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists fanfiction_posts_public_created_idx on public.fanfiction_posts (created_at desc) where is_published = true;
create index if not exists fanfiction_posts_user_idx on public.fanfiction_posts (user_id);
alter table public.fanfiction_posts enable row level security;
drop policy if exists "Public can read published fanfiction" on public.fanfiction_posts;
create policy "Public can read published fanfiction" on public.fanfiction_posts for select using (is_published = true or auth.uid() = user_id);
drop policy if exists "Signed in users can publish own fanfiction" on public.fanfiction_posts;
create policy "Signed in users can publish own fanfiction" on public.fanfiction_posts for insert to authenticated with check (auth.uid() = user_id and is_published = true);
drop policy if exists "Authors can update own fanfiction" on public.fanfiction_posts;
create policy "Authors can update own fanfiction" on public.fanfiction_posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Authors can delete own fanfiction" on public.fanfiction_posts;
create policy "Authors can delete own fanfiction" on public.fanfiction_posts for delete to authenticated using (auth.uid() = user_id);
grant select on public.fanfiction_posts to anon, authenticated;
grant insert, update, delete on public.fanfiction_posts to authenticated;
