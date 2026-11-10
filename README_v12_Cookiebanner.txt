Mila Website v12 – eigener Cookie-Banner (Übergangslösung)

Änderungen:
- Eigener Cookie-Banner mit „Alle akzeptieren“, „Nur notwendige“ und „Einstellungen“.
- Auswahl wird im Browser gespeichert und kann über „Cookie-Einstellungen“ im Footer geändert werden.
- Google Analytics 4 (G-M2E0X0Y1QK) wird erst nach aktiver Statistik-Einwilligung geladen (Basic Consent Mode / block-before-consent).
- Ohne Zustimmung wird GA4 nicht geladen.
- Google AdSense-Script wurde vorerst aus allen HTML-Seiten entfernt. Ein selbst gebauter Banner ist keine Google-zertifizierte TCF-CMP und darf nicht als Ersatz für die AdSense-Anforderung bei personalisierten Anzeigen im EWR behandelt werden.
- ads.txt bleibt im Hauptverzeichnis erhalten.

WICHTIG:
1. Diese Version ist eine technische Übergangslösung, keine rechtliche Zertifizierung oder Rechtsberatung.
2. Die Datenschutzseite enthält weiterhin Platzhalter für Verantwortliche/Anschrift und muss vor produktivem Einsatz vervollständigt werden.
3. AdSense erst wieder aktivieren, wenn eine Google-zertifizierte CMP mit IAB-TCF korrekt eingebunden ist.
4. HubSpot-Formulare/Tracking sind nicht Teil dieser Mila-Website-Änderung; das HubSpot-Formular für Google Sites ist ein separates Projekt.

Deployment:
- ZIP entpacken.
- Den Inhalt des Ordners Mila_Website_v8_Cookiefix als neue Cloudflare Pages-Version hochladen.
- Danach in einem privaten Browserfenster testen:
  a) erster Aufruf: Banner sichtbar
  b) „Nur notwendige“: keine GA4-Anfragen
  c) „Alle akzeptieren“: GA4 lädt
  d) Footer-Link „Cookie-Einstellungen“ öffnet die Auswahl erneut
