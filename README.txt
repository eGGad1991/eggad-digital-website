MARC GUDERMANN PORTFOLIO – ECHTES 3D

Start:
1. ZIP entpacken.
2. Die Dateien samt assets-Ordner auf GitHub in das bestehende Website-Repository hochladen.
3. Cloudflare Pages baut die Website nach dem Commit neu.
4. Lokal kann die Seite wegen des ES-Modul-Imports und Browser-Sicherheitsregeln eventuell nicht direkt per Doppelklick starten. Auf GitHub Pages/Cloudflare Pages funktioniert sie über HTTPS.

Technik:
- Three.js 0.160 über CDN (keine lokale Installation erforderlich)
- Aktenschrank und jede Schublade sind echte 3D-Geometrien.
- Jede Schublade fährt als eigenes 3D-Objekt entlang der Tiefe heraus. Innenseiten, Boden, Seitenwände, Rückwand, Schienen, Ordner und Front sind separate Geometrien.
- Hover fährt die Schublade teilweise heraus, Klick öffnet sie vollständig und aktualisiert den Inhalt rechts.
- Mausziehen dreht den Schrank leicht. Touch-Eingaben unterstützen Auswahl und Ziehen.

Hinweis:
- Three.js wird beim Aufruf von jsDelivr geladen; Internetverbindung ist erforderlich.
- Dies ist die Frontend-3D-Version. Supabase/Admin-Anbindung ist noch nicht integriert.

KORREKTUR NACH ERSTEM 3D-TEST:
- Kamerarichtung korrigiert: Vorderseite und linke Schrankseite sind jetzt sichtbar.
- Boden auf dunkle, dezente Fliesen mit zurückhaltenden cyanfarbenen Fugen umgestellt.
- Jede Schubladenfront hat nun eine kontrastreiche Beschriftung mit Titel und kurzer Inhaltsbeschreibung.
- Rechtes Textfeld verbreitert und Schriftgrößen, Zeilenabstände sowie Innenabstände für bessere Lesbarkeit erhöht.
