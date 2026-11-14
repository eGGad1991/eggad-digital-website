MILA WEBSITE V15 – MOBILER ADMIN-LOGIN

Neu in dieser Version:
- Eigene, mobil optimierte Login-Seite unter /login/
- Link „Admin-Login“ in der Navigation (auch im Handy-Menü) und im Footer der öffentlichen Website
- Nach erfolgreicher Anmeldung automatische Weiterleitung zu /upload/
- Die bestehende Supabase-Konfiguration und der vorhandene Upload-Bereich bleiben erhalten.

Nach Veröffentlichung über Cloudflare Pages:
1. Auf dem Handy https://mila-einfach.pages.dev/login/ öffnen.
2. Mit dem vorhandenen Supabase-Admin-Konto anmelden.
3. Bilder auswählen und hochladen.

Wichtig:
- Die ZIP-Datei muss als neue Produktionsversion bei Cloudflare Pages veröffentlicht werden.
- Passwort-Wiederherstellung ist noch nicht in dieser Login-Seite enthalten, da die Supabase-Weiterleitungsadresse zuvor noch auf localhost zeigte. Diese URL-Konfiguration muss separat auf die Live-Domain korrigiert werden.
- Die Upload-Berechtigungen bleiben Admin-only über die bestehende Tabelle public.app_admins.
