# Aktualizace Spartan Trackeru na GitHubu

1. Rozbal ZIP.
2. V repozitáři `pterrak/spartan-tracker-zs` klikni na **Add file → Upload files**.
3. Nahraj soubory z rozbalené složky. GitHub se zeptá na nahrazení souborů se stejnými názvy.
4. Potvrď přes **Commit changes**.
5. Počkej, až akce GitHub Pages doběhne se zelenou fajfkou.
6. Na počítači stránku obnov přes `Ctrl+F5`.
7. Na iPhonu aplikaci úplně zavři a znovu otevři. Pokud by zůstala stará verze, otevři stránku jednou v prohlížeči a obnov ji.

Firebase konfiguraci, doménu ani Firestore Rules není potřeba měnit.

## Migrace dat
Dosavadní záznamy zůstanou zachované. Více částečných záznamů se stejným datem se automaticky spojí do jednoho řádku. Starší desetinný spánek se převede na minuty (např. 7,5 h → 7 h 30 min).
