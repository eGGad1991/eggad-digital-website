alter table public.dark_romance_days
  add column if not exists content text not null default '';

alter table public.dark_romance_days
  add column if not exists content_format text not null default 'plain';
