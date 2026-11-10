MILA v14 – Mobile Upload App + automatische Galerie

Was jetzt mit dem bestehenden Supabase-Projekt verbunden ist:
- Projekt: Marc Gudermann (eu-central-1)
- Storage-Bucket: portfolio-media (bestehender Bucket, öffentlich lesbar)
- Öffentlicher Publishable Key ist bereits in supabase-config.js hinterlegt.
- Upload-Rechte sind direkt im bestehenden Projekt eingerichtet: Nur Admins aus public.app_admins dürfen hochladen, ändern oder löschen.
- Eine vorhandene Admin-Zuordnung wurde gefunden. Die Zugangsdaten werden aus Sicherheitsgründen nicht in der Website gespeichert.
- Bucket-Limit: 50 MB je Datei; erlaubt sind JPG, PNG, WebP und GIF.

Veröffentlichung:
1. Dieses ZIP entpacken. Die Dateien direkt aus dem Archiv-Stammverzeichnis als Cloudflare-Pages-Deployment hochladen (index.html muss im Veröffentlichungs-Stamm liegen).
2. Nach erfolgreichem Deployment die Upload-Seite öffnen: https://mila-einfach.pages.dev/upload/
3. Mit dem bereits eingerichteten Admin-Konto anmelden. Es gibt keine öffentliche Registrierung.
4. Kategorie wählen, mehrere Bilder auswählen und hochladen.
5. Danach https://mila-einfach.pages.dev/galerie.html neu laden. Die neuen Bilder werden aus portfolio-media geladen.

Kategorien:
lifestyle, gaming, ki-digital, reisen, alltag

Mobil installieren:
- iPhone: Safari → Teilen → Zum Home-Bildschirm.
- Android: Chrome-Menü → App installieren / Zum Startbildschirm hinzufügen.

Sicherheit und Datenschutz:
- Der Publishable Key ist für den Einsatz im Browser vorgesehen. Es ist kein Service-Role-Key eingebaut.
- Die Bilder im öffentlichen Bucket sind öffentlich abrufbar. Bitte keine privaten oder fremden Bilder ohne Berechtigung hochladen.
- Uploads sind durch Supabase RLS und die vorhandene Admin-Prüffunktion geschützt.
- Supabase Auth speichert die Sitzung lokal im Browser.

Wichtig:
Die Supabase-Verbindung und Storage-Richtlinien wurden eingerichtet. Der Live-Upload über die veröffentlichte Cloudflare-Seite ist noch nicht getestet, weil diese Version noch nicht deployed wurde.


V15-HINWEIS: Für den Handy-Zugang gibt es jetzt /login/ und im Website-Footer den Link „Admin-Login“. Nach Anmeldung öffnet sich /upload/.
