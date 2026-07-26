# Spartan Tracker — GitHub Pages + Firebase

Tato verze funguje ve dvou režimech:

1. **Lokální režim:** bez Firebase, data zůstávají v konkrétním prohlížeči.
2. **Cloudový režim:** po přihlášení přes Google se celý stav synchronizuje přes Cloud Firestore mezi iPhonem a počítačem.

## Co je potřeba

- bezplatný účet GitHub,
- Google účet pro Firebase,
- stažený obsah tohoto ZIPu,
- přibližně 15–30 minut na první nastavení.

Firebase Spark nevyžaduje platební kartu. Pro osobní deník jsou bezplatné limity Firestore řádově vyšší než očekávaná spotřeba.

---

## 1. Vytvoření Firebase projektu

1. Otevři **Firebase Console**.
2. Zvol **Create a project / Vytvořit projekt**.
3. Název může být například `spartan-tracker`.
4. Google Analytics můžeš pro tento osobní projekt vypnout.
5. Dokonči vytvoření projektu.

## 2. Registrace webové aplikace a konfigurace

Webová aplikace Firebase už byla zaregistrována a soubor `firebase-config.js` v tomto balíčku už obsahuje konfiguraci projektu `spartan-tracker-zs`.

Analytika se v aplikaci neinicializuje, protože pro osobní tréninkový deník není potřeba.

## 3. Zapnutí přihlášení přes Google

Google provider už máš zapnutý. Pro kontrolu:

1. Ve Firebase otevři **Build → Authentication**.
2. Otevři **Sign-in method**.
3. U provideru **Google** musí být stav **Enabled**.
4. Musí být vybraný Project support email.

Email/Password zapínat nemusíš. Aplikace používá `GoogleAuthProvider` a přihlašovací popup.

## 4. Vytvoření Firestore databáze

1. Ve Firebase otevři **Build → Firestore Database**.
2. Klikni na **Create database**.
3. Vyber **Production mode**.
4. Zvol region blízko České republice. Pro osobní projekt stačí region nabízený konzolí v EU.
5. Dokonči vytvoření databáze.

## 5. Nastavení bezpečnostních pravidel

1. Ve Firestore otevři kartu **Rules**.
2. Smaž výchozí text.
3. Vlož obsah souboru `firestore.rules`:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

4. Klikni na **Publish**.

Tato pravidla znamenají, že přihlášený uživatel smí číst a zapisovat pouze data pod svým vlastním Firebase UID.

## 6. Vytvoření GitHub repozitáře

1. Přihlas se na GitHub.
2. Klikni na **New repository**.
3. Název například `spartan-tracker`.
4. Pro GitHub Free a Pages použij nejjednodušeji **Public** repozitář.
5. Klikni na **Create repository**.
6. V repozitáři zvol **Add file → Upload files**.
7. Nahraj **obsah rozbalené složky**, nikoli samotný ZIP:
   - `index.html`
   - `app.js`
   - `firebase-config.js`
   - `manifest.webmanifest`
   - `sw.js`
   - `.nojekyll`
   - složku `icons`
   - případně dokumentaci a `firestore.rules`
8. Potvrď přes **Commit changes**.

## 7. Zapnutí GitHub Pages

1. V repozitáři otevři **Settings**.
2. V levém menu vyber **Pages**.
3. V části **Build and deployment** nastav:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
4. Klikni na **Save**.
5. Po nasazení se zobrazí adresa podobná:
   `https://TVUJ-UCET.github.io/spartan-tracker/`

## 8. Přidání domény do Firebase Authentication

1. Zkopíruj pouze doménu GitHub Pages, například:
   `TVUJ-UCET.github.io`
2. Ve Firebase otevři **Authentication → Settings → Authorized domains**.
3. Klikni na **Add domain**.
4. Vlož doménu bez `https://` a bez `/spartan-tracker/`.
5. Ulož.

## 9. První spuštění a přenos lokálních dat

1. Otevři GitHub Pages adresu.
2. Otevři **Data a nastavení**.
3. Klikni na **Přihlásit přes Google**.
4. V přihlašovacím okně vyber svůj Google účet.
5. Aktuální lokální data se nahrají do Firestore.
6. Na počítači otevři stejnou adresu a přihlas se stejným Google účtem — stáhne se novější cloudová verze.

Aplikace porovnává čas poslední změny. Novější stav se použije jako zdroj pravdy. Při souběžném upravování na dvou zařízeních je lepší nechat první zařízení synchronizaci dokončit.

## 10. Instalace na iPhone

1. Otevři GitHub Pages adresu v **Safari**.
2. Klepni na tlačítko **Sdílet**.
3. Vyber **Přidat na plochu**.
4. Zapni **Otevřít jako webovou aplikaci**, pokud se tato volba zobrazí.
5. Klepni na **Přidat**.
6. Spusť aplikaci z nové ikony.
7. Přihlas se stejným Firebase účtem.

## 11. Aktualizace aplikace

1. Uprav nebo nahraď soubory v GitHub repozitáři.
2. Proveď commit do větve `main`.
3. GitHub Pages změnu automaticky nasadí.
4. Pokud iPhone stále ukazuje starou verzi:
   - aplikaci úplně zavři a znovu otevři,
   - případně v Safari stránku obnov,
   - service worker může aktualizaci převzít až při dalším spuštění.

## 12. Zálohy

Cloudová synchronizace není totéž jako historické zálohování.

Jednou za čas použij:

- **Data a nastavení → Export zálohy** pro kompletní JSON,
- **Export měření CSV**,
- **Export tréninků CSV**.


## Doporučená videa

### GitHub Pages — oficiální GitHub
https://www.youtube.com/watch?v=b2r9Cdvssi0

Ukazuje publikování webu přes GitHub Pages, nasazení z větve a HTTPS.

### Firebase pro web — oficiální Firebase
https://www.youtube.com/watch?v=ILTo8IvFXJw

Ukazuje vytvoření projektu, připojení webové aplikace, Authentication, Firestore a Security Rules. Ve videu se používá Firebase Hosting; v tomto projektu místo něj použiješ GitHub Pages podle návodu výše.


## Nejčastější chyby

### „Firebase zatím není připojen“
Soubor `firebase-config.js` se nenačetl z GitHub Pages nebo byl při nahrávání vynechán.

### „Permission denied“
Nejsou publikována správná Firestore Rules, nebo uživatel není přihlášen.

### Přihlášení nefunguje na GitHub Pages
Přidej `TVUJ-UCET.github.io` do Firebase Authentication → Authorized domains.

### Po nahrání vidím 404
Zkontroluj:
- že je `index.html` v kořenu repozitáře,
- Pages používá větev `main` a složku `/(root)`,
- soubory nebyly nahrány o jednu vnořenou složku níže.

### Data na dvou zařízeních nejsou stejná
Zkontroluj:
- že je na obou zařízeních stejná GitHub Pages adresa,
- že jsi přihlášen stejným Google účtem,
- stav synchronizace v levém panelu / nastavení,
- Firestore Rules.
