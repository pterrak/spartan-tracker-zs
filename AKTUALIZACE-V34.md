# Spartan Tracker v3.4 – tlak, spánek a zápis tréninků

## Změny

### Krevní tlak
Do karty Měření a grafy přibyl samostatný formulář pro:

- systolický tlak,
- diastolický tlak,
- datum měření.

Tlak se zobrazuje také v historii měření a CSV exportu.

V nabídce grafu přibyla položka **Krevní tlak**. Graf zobrazuje dvě křivky a orientační zelená pásma:
- systolický 90–119 mmHg,
- diastolický 60–79 mmHg.

Poznámka v aplikaci výslovně uvádí, že AHA definuje normální tlak jako <120/<80 mmHg, tlak <90/60 mmHg se běžně označuje jako nízký a zelené pásmo je pouze praktická pomůcka, nikoli diagnóza.

### Průměrný spánek
Na Přehledu:
- velká hodnota = průměr za posledních 7 kalendářních dní,
- malý text = celkový průměr všech uložených nocí.

Do týdenního průměru se započítají pouze skutečně uložené hodnoty v posledních 7 dnech.

### Zápis tréninků
Odstraněno globální tlačítko `Zapsat trénink` ze záhlaví.
Na Přehledu už tlačítka u nejbližších tréninků pouze informují o typu aktivity a nic nezapisují.

Trénink se nově zapisuje pouze na kartě **Tréninkový plán**:
- zaškrtnutím checkboxu,
- nebo tlačítkem `Zapsat` u konkrétní plánované jednotky.

Tím se odstraní nejasnost mezi vlastním tréninkem a plánovanou jednotkou.

## Aktualizace GitHubu

Do kořene repozitáře nahraj:

- `index.html`
- `app-v34.js`
- `sw.js`
- `manifest.webmanifest`
- `AKTUALIZACE-V34.md`

Staré soubory `app-v31.js`, `app-v32.js` a `app-v33.js` nemusíš mazat.

Po dokončení GitHub Actions otevři:

`https://pterrak.github.io/spartan-tracker-zs/?v=34`

U loga musí být uvedeno `Liberec 2027 · v3.4`.
