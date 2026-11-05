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

NACHBESSERUNG:
- Ursache der unsichtbaren Beschriftung behoben: Texttafeln liegen jetzt eindeutig vor der Metallfront und sind kontrastreich.
- Umgebung deutlich aufgewertet: beleuchtete Architektur-Rückwand, Wandstreben, Deckenlicht, dunkler glänzender Fliesenboden, seitlicher Schreibtisch mit Monitor und Pflanze.
- Schatten und Licht verstärkt, damit der Schrank räumlich in der Szene steht statt wie ein schwarzer Kasten vor leerem Hintergrund zu wirken.

LABEL- UND DARSTELLUNGSFIX:
- Beschriftung wurde auf echte Three.js-Sprites umgestellt, die sich mit der Schublade bewegen und zur Kamera ausgerichtet bleiben. Damit sind Titel und Untertitel nicht mehr von der Metallfront verdeckt.
- Frontplatten und Griffe wurden neu angeordnet, damit die Schriftfläche Platz hat.
- Kamera weiter zurückgesetzt und Licht-/Wandakzente reduziert, damit die Szene weniger wie ein schwarzer Rohbau wirkt.

KORREKTUR – BESCHRIFTUNG DIREKT AUF DER SCHUBLADE:
- Die schwebenden Kamera-Sprites wurden entfernt.
- Jede Beschriftung ist jetzt eine echte Plane-Geometrie, direkt auf der Frontplatte montiert und Bestandteil der jeweiligen Schublade.
- Die Platte fährt deshalb gemeinsam mit der Schublade heraus.
- Die Fronten wurden heller und kontrastreicher gestaltet, mit klaren Kanten und Cyan-Akzenten.
- Kamerawinkel stärker auf die Schrankfront ausgerichtet.

ROOT CAUSE FIX – TEXT DIRECTLY ON THE FRONT MATERIAL:
- The drawer label is no longer a separate plane or sprite.
- The text is now rendered into a CanvasTexture and applied to the +Z/front material of the drawer's actual fascia BoxGeometry.
- This makes the title and description physically part of the visible front face, so it cannot float separately or sit behind the front panel.
- The pull handle is positioned below the text.
- Camera is closer to frontal so the lettering remains legible.
