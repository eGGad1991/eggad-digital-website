-- Mila blog post ratings and comments
-- Applied to Supabase project xspibbzwfwhmgvfowiye on 2026-11-17.
-- Public submissions remain pending until a Mila administrator approves them.

create table if not exists public.blog_post_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  rating numeric(2,1) not null
    check (rating >= 0.5 and rating <= 5.0 and mod(rating * 2, 1) = 0),
  display_name text not null default 'Gast'
    check (char_length(trim(display_name)) between 1 and 60),
  comment text not null
    check (char_length(trim(comment)) between 5 and 1500),
  visitor_token uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint blog_post_reviews_one_per_browser_per_post unique (post_id, visitor_token)
);

create index if not exists blog_post_reviews_post_status_created_idx
  on public.blog_post_reviews (post_id, status, created_at desc);

alter table public.blog_post_reviews enable row level security;

drop policy if exists "Approved reviews are public for published posts" on public.blog_post_reviews;
create policy "Approved reviews are public for published posts"
on public.blog_post_reviews
for select to anon, authenticated
using (
  status = 'approved'
  and exists (
    select 1 from public.blog_posts p
    where p.id = blog_post_reviews.post_id and p.status = 'published'
  )
);

drop policy if exists "Mila admins can read all blog reviews" on public.blog_post_reviews;
create policy "Mila admins can read all blog reviews"
on public.blog_post_reviews
for select to authenticated
using ((select public.is_portfolio_admin()));

drop policy if exists "Visitors can submit pending blog reviews" on public.blog_post_reviews;
create policy "Visitors can submit pending blog reviews"
on public.blog_post_reviews
for insert to anon, authenticated
with check (
  status = 'pending'
  and exists (
    select 1 from public.blog_posts p
    where p.id = blog_post_reviews.post_id and p.status = 'published'
  )
);

drop policy if exists "Mila admins can update blog reviews" on public.blog_post_reviews;
create policy "Mila admins can update blog reviews"
on public.blog_post_reviews
for update to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

drop policy if exists "Mila admins can delete blog reviews" on public.blog_post_reviews;
create policy "Mila admins can delete blog reviews"
on public.blog_post_reviews
for delete to authenticated
using ((select public.is_portfolio_admin()));

grant select, insert on public.blog_post_reviews to anon;
grant select, insert, update, delete on public.blog_post_reviews to authenticated;
