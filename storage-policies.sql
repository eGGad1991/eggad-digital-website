-- Storage-Berechtigungen für den vorhandenen Bucket portfolio-media
-- Ausführen im Supabase SQL Editor.
-- Öffentliche Besucher dürfen Dateien ansehen. Upload/Änderung/Löschen nur Admins.

drop policy if exists "Public can view portfolio media" on storage.objects;
create policy "Public can view portfolio media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

drop policy if exists "Portfolio admins can upload media" on storage.objects;
create policy "Portfolio admins can upload media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
);

drop policy if exists "Portfolio admins can update media" on storage.objects;
create policy "Portfolio admins can update media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
)
with check (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
);

drop policy if exists "Portfolio admins can delete media" on storage.objects;
create policy "Portfolio admins can delete media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
);
