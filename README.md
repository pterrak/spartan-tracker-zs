# Spartan · Prostor pro pohyb

Responzivní osobní deník pohybu s Firebase Auth, Firestore a offline frontou změn. Verze 4 zjednodušuje zadávání podle skutečně používaných údajů a podporuje postupný návrat k pohybu s prostorem pro práci a rodinu.

## Co je nového

- Čtyři obrazovky: Dnes, Pohyb, Pokrok a Plán a cíle.
- Dvě krátké jednotky na začátek, volitelný pohyb navíc a ruční postup do dalších úrovní.
- Běžný, nabitý a rodinný týden. Rodinný režim se také zapíná čtyři týdny před a osm týdnů po soukromě nastaveném rodinném termínu.
- Dlouhodobý cíl Liberec 2027 bez neověřeného data; volitelný horský půlmaraton Sušice 10. dubna 2027. Plavání zůstává volitelné.
- Formuláře, grafy a rutina zobrazují používaná pole. Výchozí pravidlo je alespoň čtyři vyplnění a 20 % příslušných záznamů; výběr se uloží do soukromého profilu, aby pole později nemizela.
- Historická data včetně skrytých polí zůstávají v databázi a úplném JSON exportu. Zálohu lze sloučit s aktuálními daty.
- Změny se synchronizují transakcí a slučují po upravených záznamech a polích. Cloudová data mají při přihlášení přednost; čekající změny patří konkrétnímu účtu.

## Soubory

- `index.html`, `styles.css`: rozhraní a responzivní vzhled.
- `app-v4.mjs`: ovládání, formuláře, přihlášení a synchronizace.
- `core.mjs`: datový model, kompatibilita, statistiky a plán.
- `ui.mjs`: vykreslení obrazovek a grafů.
- `firebase-config.js`: veřejná konfigurace Firebase SDK, nikoli přihlašovací tajemství.
- `firestore.rules`: pravidla přístupu k uživatelským datům.
- `sw.js`: cache statických souborů; neukládá odpovědi Auth/Firestore API.
- `tests/core.test.mjs`: testy migrace, výběru polí, sloučení a termínů.

Osobní údaje a exporty nepatří do repozitáře. Starší skripty jsou ponechané kvůli historii, vstupní stránka používá pouze verzi 4.

## Lokální spuštění a kontrola

Spusť kořen repozitáře přes HTTP, například `python -m http.server 8000`, a otevři `http://localhost:8000`. Pro přihlášení musí být doména povolená ve Firebase Auth. Bez přihlášení funguje místní deník; na jiném zařízení je potřeba stejný Google účet.

```bash
node --test tests/core.test.mjs
node --check app-v4.mjs
node --check ui.mjs
```

Nasazení používá stávající GitHub Pages. Firebase SDK je připnuté na verzi 12.16.0. Při změně statických souborů aktualizuj verzi cache v `sw.js`.
