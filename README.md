# Spartan · Prostor pro pohyb

Responzivní osobní deník pohybu s Firebase Auth, Firestore a offline frontou změn. Verze 4 zjednodušuje zadávání podle skutečně používaných údajů a podporuje postupný návrat k pohybu s prostorem pro práci a rodinu.

## Verze 4.2

- Denní rutina je stále rozbalená. Vitamíny D, B a C jsou tři samostatné položky, přidané i u účtů s dříve uloženým výběrem polí. Historie a ostatní doplňky zůstávají zachované.
- Automatický postup používá 12 malých kroků napříč čtyřmi úrovněmi. Vyhodnocuje pouze uzavřené týdny od začátku přípravy. Další krok vyžaduje dva dostatečně splněné týdny; současný týden sám sobě nezvyšuje cíle.
- Základní jednotky musí být v různých dnech a mít alespoň 80 % plánované délky. Před zařazením třetí povinné jednotky se vyžaduje zvládnutí volitelného terénu. Záznamy uchovávají režim a fázi tréninku, aby se krátké rodinné a pracovní týdny nezapočítaly jako důvod pro přidání.
- Po třech zvládnutých týdnech následuje odlehčení. Automatický režim po dvou týdnech bez aktivit vrací začátek; po opakovaném neplnění ubírá. Zaznamenaná bolest, nízká energie nebo málo spánku blokují zvyšování. Chybějící měření se nepovažují za nuly.
- Závodní příprava u pokročilého kroku a doloženého základu přidá nejvýše jednu kontrolovanou jednotku do kopce během posledních 12 týdnů. Nemění současně její délku.
- Před aktivním závodem se objem snižuje 14–8 dní předem na přibližně 65 %, poslední týden na 45 %. Poslední dva dny jsou volitelné krátké rozhýbání nebo volno. Po závodě následuje týden regenerace a týden lehkého návratu. Konkrétní minuty se zaokrouhlují dolů.
- Rodinný režim má přednost. Uživatel může postup pozastavit, snížit krok, přepnout na ruční postup nebo deaktivovat závod. Liberec vyžaduje skutečné datum v Nastavení; datum se neodhaduje.
- Jde o konzervativní pravidla aplikace pro návrat ke kondici, nikoli záruku závodní připravenosti či automatické zdravotní posouzení. Principy a zdroje jsou uvedené v aplikaci. Testy zahrnují plnění, výpadky, režimy, únavu, fáze závodů a izolované ukládání vitamínů.

## Verze 4.1

- Hlavní záložky Týden a Měření se soustředí na aktuální plán a rychlé samostatné zadávání. Historie aktivit je rozbalovací součástí Pokroku.
- Každé měření má vlastní formulář a uložení; spánek a subjektivní škály používají výběrová pole. Rozepsané hodnoty v ostatních kartách zůstávají zachované při ukládání i přepnutí záložky.
- Grafy mají dlouhodobý průměr, průměr posledních sedmi kalendářních dnů, klouzavý průměr posledních až pěti měření a výběr období. Prázdné dny se nepočítají jako nuly. Body lze prohlížet dotykem i klávesnicí.
- Společný graf tlaku nabízí orientační čáry pro domácí měření a vysvětlení se zdroji NHS. Nejde o osobní léčebné cíle.
- Klidný týden přidává dobrovolnou lehkou aktivitu; postup do náročnější úrovně zůstává ruční po zvládnuté přípravě. Rodinný režim má přednost.
- U cviků jsou obnovená videa z původní knihovny, včetně vloženého přehrávače a odkazu na YouTube. Původní vyhledávací odkazy jsou označené jako vyhledávání.
- `views.mjs` obsahuje hlavní obrazovky, `insights.mjs` výpočty a grafy, `exercises.mjs` knihovnu ukázek.

## Základ verze 4

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
node --test tests/*.test.mjs
node --check app-v4.mjs
node --check ui.mjs
```

Nasazení používá stávající GitHub Pages. Firebase SDK je připnuté na verzi 12.16.0. Při změně statických souborů aktualizuj verzi cache v `sw.js`.
