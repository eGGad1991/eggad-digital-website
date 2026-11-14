-- Mila Galerie: Storage-Richtlinien für den vorhandenen Bucket portfolio-media
-- Öffentliche Besucher dürfen Bilder ansehen und die Galerie auflisten.
-- Nur Benutzer aus public.app_admins dürfen Bilder hochladen, ändern oder löschen.
-- Die Admin-Prüfung erfolgt über die vorhandene Funktion public.is_portfolio_admin().

 drop policy if exists "Public can read portfolio media files" on storage.objects;
 drop policy if exists "Portfolio admins can upload media files" on storage.objects;
 drop policy if exists "Portfolio admins can update media files" on storage.objects;
 drop policy if exists "Portfolio admins can delete media files" on storage.objects;

create policy "Public can read portfolio media files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

create policy "Portfolio admins can upload media files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

create policy "Portfolio admins can update media files"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin())
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

create policy "Portfolio admins can delete media files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());
