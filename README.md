# Spartan Tracker — Firebase Edition

Mobilní PWA pro plán, běh, plavání, silový trénink s kettlebelly a gumami, měření a grafy.

## Hlavní soubory
- `index.html` — rozhraní,
- `app.js` — plán, grafy, Google přihlášení, Firebase Auth a synchronizace,
- `firebase-config.js` — obsahuje konfiguraci projektu `spartan-tracker-zs`,
- `firestore.rules` — bezpečnostní pravidla,
- `SETUP-GITHUB-FIREBASE.md` — podrobný instalační návod.

## Lokální náhled
Modulové skripty je vhodné spustit přes lokální HTTP server:

```bash
python3 -m http.server 8000
```

Potom otevři `http://localhost:8000`.

Bez doplněné Firebase konfigurace aplikace normálně funguje v lokálním režimu.


## Verze 3 – měření a denní rutina
- opraven průměr spánku (prázdné hodnoty se už nezapočítávají jako nuly),
- spánek se ukládá v hodinách a minutách,
- samostatné formuláře pro spánek, váhu, denní stav a kontrolní test,
- více záznamů stejného dne se při migraci spojí do jednoho řádku,
- denní checklist doplňků,
- nové responzivní SVG grafy.
