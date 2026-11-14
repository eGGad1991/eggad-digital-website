MILA WEBSITE V16 – DIREKT IN DIE GALERIE HOCHLADEN

Änderung gegenüber v15:
- Die Kategorieauswahl (Lifestyle, Gaming usw.) wurde entfernt.
- Alle neuen Uploads werden automatisch im Ordner "galerie" des bestehenden Supabase-Buckets "portfolio-media" gespeichert.
- Die öffentliche Galerie zeigt Bilder aus "galerie" sowie weiterhin aus den bisherigen Kategorie-Ordnern an. Vorhandene Bilder bleiben also sichtbar.
- Der Cache der mobilen Upload-App wurde aktualisiert, damit Handys die neue Version laden.

Upload:
1. ZIP entpacken und den Inhalt des Archivs als neue Produktionsversion bei Cloudflare Pages veröffentlichen.
2. Auf dem Handy https://mila-einfach.pages.dev/login/ öffnen und anmelden.
3. Bilder auswählen und auf "Ausgewählte Bilder hochladen" tippen. Eine Kategorie muss nicht ausgewählt werden.
4. Neue Bilder erscheinen nach dem Neuladen unter https://mila-einfach.pages.dev/galerie.html.

Technik:
- Bestehendes Supabase-Projekt und Bucket "portfolio-media" werden weiterverwendet.
- Uploads sind weiterhin nur für angemeldete Nutzer erlaubt, die in public.app_admins eingetragen sind.
- Es werden keine neuen Tabellen, Buckets oder Benutzer angelegt.
- Unterstützt: JPG, PNG, WebP, GIF; maximal 50 MB je Bild.

Hinweis: Das ZIP ist erstellt und die Pfade in der Upload-App und Galerie sind angepasst. Es wurde nicht automatisch zu Cloudflare Pages hochgeladen.
