# Spartan Tracker v3.2 – doplněk na cholesterol

## Co se mění

Do denního checklistu doplňků byla přidána položka:

- Doplněk na cholesterol – 1× denně

Celkový denní stav je nyní počítán ze 6 položek:

1. Kreatin – 1. dávka
2. Kreatin – 2. dávka
3. Kolagen
4. Magnezium
5. Multivitamin
6. Doplněk na cholesterol

Položka se synchronizuje přes Firebase stejně jako ostatní doplňky a zobrazuje se i v historii posledních 14 dní.

## Aktualizace GitHubu

Do kořene repozitáře nahraj:

- `index.html`
- `app-v32.js`
- `sw.js`
- `manifest.webmanifest`
- `AKTUALIZACE-V32.md`

Původní `app-v31.js` nemusíš mazat. Nová verze jej už nepoužívá.

Po dokončení GitHub Actions otevři:

`https://pterrak.github.io/spartan-tracker-zs/?v=32`

U loga musí být uvedeno `Liberec 2027 · v3.2`.

Na iPhonu aplikaci úplně zavři a znovu otevři. Pokud zůstane stará verze, otevři nejprve adresu s `?v=32` v prohlížeči.
