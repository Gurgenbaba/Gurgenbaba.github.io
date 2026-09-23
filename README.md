# Gurgenbaba

Portfolio und Anfrageseite von Gurgenbaba: Websites, Online-Shops, Web-Apps und Browsergames.

**Live:** https://gurgenbaba.github.io/ · Englisch: https://gurgenbaba.github.io/en/

Statisches HTML, ein Stylesheet, ein Script. Kein Build-Schritt, kein Framework. GitHub Pages liefert `main` direkt aus.

## Aufbau

```
index.html                          Startseite DE
en/index.html                       Startseite EN (gleiche Struktur, eigene Anker-IDs)
case-study/genesis-colonies/        Case Study DE
en/case-study/genesis-colonies/     Case Study EN
404.html                            Spielbare Fehlerseite (eigenes Inline-Script)
impressum.html, datenschutz.html    Rechtstexte (nur DE)
sitemap.xml, robots.txt             Für Suchmaschinen
assets/css/site.css                 Alle Styles, 21 nummerierte Bereiche (Inhaltsverzeichnis oben)
assets/js/site.js                   13 Module, jedes beendet sich selbst ohne passendes Markup
assets/js/arcade.js                 Arcade-Spiel, wird erst beim Start nachgeladen
assets/fonts/                       Unbounded (OFL), selbst gehostet
assets/img/                         Nur optimierte Kopien, Herkunft in assets/README.md
tools/                              Asset- und QA-Skripte (nicht Teil der Website)
```

## Lokal ansehen

```bash
python -m http.server 8791
```

Dann http://127.0.0.1:8791/ öffnen. Die Sprachwahl erscheint beim ersten Besuch. Zum erneuten Testen `localStorage` für die Seite leeren.

Aufrufe an `genesis-colonies.com` (Live-Zahlen, Arcade-Bestenliste, Kontaktformular) scheitern lokal an CORS. Das ist gewollt: Diese Bereiche bleiben dann einfach unsichtbar bzw. zeigen die Ausweichlösung.

## QA

```bash
python tools/qa-viewports.py
```

Prüft alle 7 Seiten bei 1920, 1366, 375 und 320 px. Der Lauf schlägt fehl bei seitlichem Scrollen, kaputten Bildern, Script-Fehlern oder fehlgeschlagenen Anfragen. Screenshots landen in `artifacts/qa/` (ignoriert). Voraussetzung: `pip install playwright` und `playwright install chromium`.

## Backend (Genesis Colonies)

Die Seite ist statisch. Alles Dynamische läuft über öffentliche Routen im Genesis-Colonies-Server (Repo `Gurgenbaba/genesis-colonies`, Railway):

| Route | Wofür | Railway-Variablen |
|---|---|---|
| `GET /api/public/stats` | Live-Zahlen im Genesis-Abschnitt und in der Case Study | – |
| `POST /api/public/arcade/run`, `GET/POST /api/public/arcade/scores` | Arcade-Bestenliste | – |
| `POST /api/public/contact` | Anfrage-Assistent inkl. Anhängen (max. 5 Dateien, 10 MB) | `CONTACT_GITHUB_TOKEN` + `CONTACT_GITHUB_REPO` (Tickets im privaten Repo `Gurgenbaba/auftraege`), `CONTACT_DISCORD_WEBHOOK`, optional `CONTACT_SMTP_USER` + `CONTACT_SMTP_PASSWORD` |

CORS ist auf `GC_PUBLIC_STATS_ORIGINS` beschränkt (Standard `https://gurgenbaba.github.io`). Bei einer eigenen Domain muss sie dort ergänzt werden.

## Regeln, die man leicht vergisst

- **Keine Unterseite darf wie ein Repo heißen.** `gurgenbaba.github.io/<repo-name>/` gehört GitHub für die Pages des gleichnamigen Repos. `/genesis-colonies/` zeigte deshalb „There isn't a GitHub Pages site here“. Unterseiten gehören unter Sammelordner wie `/case-study/…`.
- **DE und EN gemeinsam pflegen.** Jede inhaltliche Änderung an `index.html` gehört auch in `en/index.html`, dasselbe gilt für die Case Study.
- **Neue externe Aufrufe oder Speicherungen → Datenschutzerklärung anpassen.** Derzeit dokumentiert: GitHub Pages, `localStorage` (`gb-lang`), Live-Statistik, Arcade, Kontaktformular (Railway, GitHub-Tickets, Discord, Gmail).
- **Bewegung nur unter `.fx`.** `<head>` setzt die Klasse nur, wenn die Person keine reduzierte Bewegung eingestellt hat.
- **Bilder nur als optimierte Kopie ablegen** und in `assets/README.md` eintragen.
