MILA v13 – Mobile Upload App + automatische Galerie

Vorhandene Infrastruktur:
- Supabase-Projekt: https://xspibbzwfwhmgvfowiye.supabase.co
- Storage-Bucket: portfolio-media (öffentlich, 50 MB Limit)
- Auth: E-Mail/Passwort, Admin-Benutzer ist bereits vorhanden.
- Der öffentliche Publishable-/Anon-Key muss in supabase-config.js ergänzt werden. Niemals service_role/secret key verwenden.

Einmalige Einrichtung:
1. In supabase-config.js den Platzhalter HIER_DEIN_SUPABASE_PUBLISHABLE_KEY_EINFUEGEN durch den PUBLIC Publishable Key des bestehenden Projekts ersetzen.
2. Im Supabase SQL Editor den Inhalt von SUPABASE_STORAGE_POLICIES.sql ausführen.
3. Die Dateien dieser Version als Website-Deployment auf Cloudflare Pages veröffentlichen.
4. Upload-App aufrufen: https://mila-einfach.pages.dev/upload/
5. Mit dem bereits angelegten Supabase-Admin-Benutzer anmelden.
6. Auf iPhone: Safari → Teilen → Zum Home-Bildschirm. Auf Android: Chrome-Menü → App installieren / Zum Startbildschirm hinzufügen.

Nutzung:
- Kategorie wählen.
- Mehrere JPG/PNG/WebP/GIF-Bilder auswählen.
- Upload starten.
- Die Galerie-Seite listet neue Bilder automatisch aus dem Storage-Bucket auf.

Ordner/Kategorien:
lifestyle, gaming, ki-digital, reisen, alltag

Sicherheit:
- Kein Service-Role-Key im Browser.
- Upload nur für angemeldete Supabase-Benutzer.
- Der Bucket ist öffentlich lesbar; dadurch sind die hochgeladenen Bilder öffentlich erreichbar. Keine privaten Bilder hochladen.
- Delete-Policy ist für angemeldete Nutzer gesetzt; die App bietet aktuell noch keine Löschfunktion.
- Das Formular nutzt Supabase Auth; es gibt keine öffentliche Registrierung in der App.

Hinweis:
- Diese Integration baut auf v12 auf. Wenn v12 noch nicht live ist, veröffentliche v13 als vollständiges Deployment.
- Nach dem Einrichten testen: Login, ein Testbild hochladen, Galerie-Seite neu laden.
