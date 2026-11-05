# Portfolio Marc Gudermann

## Dateien
- `index.html`: Seitenstruktur und Views
- `styles.css`: Design und responsive Darstellung
- `app.js`: Navigation, Supabase-Lesezugriffe und Admin-Funktionen
- `config.js`: Supabase-Projekt-URL, Publishable Key und Storage-Bucket
- `profile-photo.png`: bereitgestelltes Profilfoto

## Veröffentlichung
Alle Dateien im Root-Verzeichnis des GitHub-Repositories ablegen und committen. Cloudflare Pages veröffentlicht danach automatisch.

## Wichtige Hinweise vor dem Livegang
1. In Supabase müssen für den Storage-Bucket `portfolio-media` Storage-Policies eingerichtet werden: öffentliche Lesezugriffe und Upload/Änderung/Löschen nur für `public.is_portfolio_admin()`.
2. Die Website nutzt die vorhandenen Tabellen `portfolio_profile`, `portfolio_drawers`, `projects`, `project_blocks`, `portfolio_media` und `app_admins`.
3. Die Login-Seite ist nicht öffentlich registrierbar. Der bestehende Auth-Benutzer muss in `app_admins` eingetragen sein.
4. Der Publishable Key ist für die Verwendung im Browser vorgesehen. Niemals `service_role` oder Secret Keys in `config.js` eintragen.
5. Die Start-Projekte sind zunächst Entwürfe und werden daher öffentlich noch nicht angezeigt. Im Adminbereich können sie auf „Veröffentlicht“ gesetzt werden.
6. Für den vollständigen Projektblock-Editor werden die JSON-Inhalte im jeweiligen Block bearbeitet. Bilddateien werden über den Medien-Upload ergänzt; der Storage-Bucket benötigt dafür die genannten Policies.

## Lokaler Test
Die Dateien über einen lokalen Webserver oder direkt über Cloudflare Pages öffnen. Für Login und Datenbankzugriff ist eine Internetverbindung erforderlich.
