# Aero pozice na časovkářském kole

Webová aplikace pro zlepšení aerodynamické pozice na časovkářském kole. Běží celá v prohlížeči (žádný server, žádné účty), fotky a data se nikam neodesílají. Je určená jen pro osobní použití.

- Web: https://zkovacevicfilip-del.github.io/test/ (GitHub Pages z větve `main`, složka root)
- Soubory: `index.html` (stránka, část Pozice a mobilita, styly), `aero.js` (část Aero a výkon), `history.js` (Moje pozice), `share.js` (sdílení), `ui.js` (animace menu)
- PWA: `manifest.webmanifest`, `sw.js` (jen úklid staré offline cache), `pwa.js` (tlačítko instalace), `icons/`

> Toto README je předávací shrnutí dosavadního vývoje, aby nový chat s Claude přesně věděl, v jaké fázi projekt je.

Kontext a pravidla spolupráce s Claude jsou v [CLAUDE.md](CLAUDE.md).

## Cíl projektu

Z fotek a videí ze čtyř pohledů (levá strana, pravá strana, zepředu, zezadu) automaticky najít klíčové body těla, spočítat úhly, ověřit je proti vlastní mobilitě a navrhnout malé úpravy pozice a vybavení. Hlídá se komfort a to, aby pozice neomezovala výkon z nohou. Navíc spočítat watty z CdA a CdA změřit z jízdy.

## Co aplikace dnes umí

### Část Pozice a mobilita (`index.html`)
- Volba režimu: **pevné stanoviště** (stativ, bez korekce) nebo **z ruky s korekcí perspektivy** (u bočních pohledů se označí osy a okraje předního kola, aplikace srovná náklon a vodorovné zkreslení).
- Pohledy levá, pravá, zepředu, zezadu. U každého fotka z galerie, fotoaparát, nebo **video** (až 90 snímků, statistiky přes celý cyklus šlapání).
- **Automatická detekce těla** (MediaPipe Pose Landmarker 0.10.14; knihovna i model `pose_landmarker_full` jsou součástí aplikace ve složce `vendor/`, takže se při detekci nic nestahuje z cizích serverů). Ruční označení bodů je vypnuté, zapne se jen při selhání detekce nebo zaškrtnutím. Do textu pro Claude se uvede, že byly body upraveny ručně.
- Z boku: koleno, kyčel, sklon trupu, loket, rameno (levá, pravá, rozdíl, zvýrazněno nad 5°). U videa koleno dole a nahoře, kyčel nejvíc zavřená a otevřená, rozkmit trupu.
- Zepředu a zezadu: sklon ramen, sklon pánve, boční náklon trupu, vybočení kolen, poměry šířek (jen zepředu).
- **Mobilita:** čtyři testy z boku (kyčel koleno k hrudi, rameno paže nad hlavu, kotník koleno k zdi, předklon vsedě). Limit pro pozici je 85 % maxima. Aplikace ukáže rezervu nebo nedostatek v ° a určí oblast, kterou má smysl zlepšit.
- Výstup: hotový text s údaji, výsledky a prosbou o rady, který se zkopíruje do Claude.

### Vzhled
- Minimalistický vzhled v paletě **Track black `#17191B`** (pozadí), **Chalk grey `#E4E3DE`** (text, hlavní tlačítka s tmavým textem, pilulka výběru) a **Electric purple `#8B3DFF`** (body těla, virtuální výška, varování, logo). Karty, okraje a tlumený text jsou odstíny smíchané z Track black a Chalk grey (tlumený text `#9A9A98` má kontrast nejméně 4,8 : 1). Druhá barva pro data zůstává tyrkysová `#36c5f0` (pravá strana, osy kola, skutečná výška, obrys čelní plochy). Drobný fialový text (štítky „neprůkazné“, „mimo změřený rozsah“) má světlejší odstín `#A66FF5` (`--pt-text`), protože čistá `#8B3DFF` má na tmavém pozadí kontrast jen 3,5 : 1. Na čáry a body to stačí, na malé písmo ne. Tisk právních stránek zůstává černobílý.
- Barvy jsou proměnné v `:root` v `index.html` (právní stránky mají stejné v `legal.css`). Ve stylech nejsou žádné barvy napsané natvrdo, jen stíny (`rgba(0,0,0,…)`) a masky přechodů. Skripty pro kreslení čtou `--pt`, `--accent`, `--c1`, `--c2`, `--muted`, `--line`, `--surface`, `--ink` a `--bg`; `--c1` musí zůstat ve tvaru `#rrggbb`. Barva lišty prohlížeče je v `theme-color` všech stránek a v `manifest.webmanifest`.
- Hlavní menu (`#topnav`): světlá pilulka plynule přejede pod zvolené tlačítko, to se roztáhne a ostatní odsune do stran (`ui.js`). Na úzkém telefonu mají neaktivní tlačítka zkrácený popisek (Pozice, Aero, Moje), pod 375 px jen ikonu. Obsah vjede ze strany podle směru přepnutí a stránka se vrátí na začátek obsahu.
- **Všechny vodorovné výběry mají stejnou animaci jako hlavní menu:** záložky v Aero a výkon, „Z .fit souboru / Zadat ručně“, pohledy, mobilita a Výsledky. Světlá pilulka přejede pod zvolené tlačítko, to se roztáhne a ostatní odsune, obsah vjede ze strany podle směru. Když se výběr nevejde na šířku (telefon), dá se posouvat prstem, okraj se ztrácí a zvolená volba se sama posune do středu.
- Technicky: výběr má třídu `.seg`, atribut `data-pane` říká, který obsah má vjet. `ui.js` jen sleduje, které tlačítko má třídu `on`. Záložky pohledů se kvůli animaci vytvoří jednou a pak se jen přepíná zvolená (`renderTabs` v `index.html`).
- Úvodní popis aplikace je pod rozbalovacím „Co aplikace umí“.
- **Logo** (`icons/logo.svg`): jezdec v aero pozici nakreslený výrazným světlým obrysem (inspirace stylem kreslených motorkářských log), s plochým trupem, časovkářskou helmou ve tvaru kapky, rukama na nástavcích a nohou k pedálu. Všechny světlé čáry (kola, rám i obrys jezdce) mají stejnou tloušťku. Kolo a dvě fialové proudnice obtékají helmu a záda a za jezdcem se rozpadají do čárek. Jen Track black, Chalk grey a Electric purple. PNG ikony (`icon-192`, `icon-512`, `icon-maskable-512` s obsahem v bezpečné zóně pro kruhovou masku, `apple-touch-icon`) jsou vyrenderované z tohoto návrhu, `favicon-32` má kvůli čitelnosti plnou siluetu. Adresy ikon mají `?v=9`, při další změně ikon číslo zvýšit (v `manifest.webmanifest`, `index.html` a na právních stránkách).
- `ui.js` mění jen vzhled (animace, pilulka, `aria-current`), přepínání dělá dál `aero.js`. Při zapnutém „omezit pohyb“ v systému se animace vypnou.
- Otestováno v Playwrightu na telefonu (412 a 360 px) a tabletu (1000 px): všechny dřívější testy funkcí prošly, aplikace jde nainstalovat.

### Instalace (PWA, bez offline režimu)
- Na Androidu v Chrome tlačítko **Nainstalovat aplikaci** nahoře (zobrazí se, jen když to Chrome nabídne), nebo menu ⋮ → Nainstalovat aplikaci. Pak se spouští jako samostatná aplikace s ikonou.
- Offline režim byl na přání autora odstraněn: aplikace i modely MediaPipe se vždy načítají ze sítě. `sw.js` nic neukládá, jen smaže dřívější offline cache (asi 21 MB) a zůstává kvůli instalaci.
- Dole na stránce jsou odkazy na Podmínky použití, Ochranu osobních údajů a Licence a údaj o verzi (`#appVer` v `index.html`), podle kterého se na tabletu pozná, jestli se načetla nová verze. Při každém vydání ho aktualizovat. Odkaz na manifest má taky `?v=` (stejné číslo jako ikony).
- **Při změně kteréhokoli skriptu zvýšit číslo `?v=` u jeho načtení v `index.html`** (teď `aero.js` `?v=17`, `share.js` a `history.js` `?v=16`, `pwa.js` a `ui.js` `?v=15`, `terms.js` a `pos.js` `?v=2`, `boot.js` `?v=1`, `legal.css` `?v=3`; `share.js` se načítá i v `soukromi.html`), aby prohlížeč nevzal starou verzi ze své mezipaměti.

### Část Aero a výkon (`aero.js`)
1. **Kalkulačka:** z CdA, hmotnosti, Crr, teploty, nadmořské výšky a účinnosti spočítá watty při zvolené rychlosti (výchozí 40 km/h), rozpad na aero, valivý odpor a ztráty, čas na zadanou vzdálenost a tabulku citlivosti na změnu CdA. Pro orientaci: 0,01 m² CdA ≈ 8 W při 40 km/h.
2. **Čelní plocha z fotky zepředu:** segmentace obrysu (MediaPipe ImageSegmenter, DeepLab), měřítko podle listu A4 nebo předního kola, ukládání variant, srovnání v %. Ke každé variantě jde zapsat změřené CdA (z CdA z jízdy). S jedním měřením počítá přímou úměru (osobní Cd = CdA / plocha). Se 2 a více měřeními různých ploch (aspoň 3 % rozdíl) proloží přímku CdA = a + b × plocha, kde a je část odporu nezávislá na ploše. Od 3 měření ukáže 95% nejistotu odhadu a označí odhady mimo změřený rozsah. Když data přímce odporují (větší plocha, menší CdA), vrátí se k přímé úměře a upozorní.
3. **Výkon v pozici:** tři pevné pozice (1 současná jako reference, 2 a 3 s popisem, který se doplňuje až po měření). Doporučený protokol: 6 intervalů po 8 min v pořadí 1, 2, 3, 3, 2, 1. Data buď z `.fit` (vlastní parser FIT), nebo ručně. Srovnání výkonu, tepu, W/tep, kadence a subjektivního pohodlí (1 až 10). Data se ukládají v `localStorage`. U každé pozice aplikace spočítá rozdíl proti referenci s 95% nejistotou z rozptylu intervalů a napíše, jestli je rozdíl průkazný.
4. **CdA z jízdy (virtual elevation):** z venkovního `.fit` souboru (okruh, kola oddělená tlačítkem Lap) metodou nejmenších čtverců odhadne CdA pro každou pozici a Crr, ukáže graf virtuální vs. skutečné výšky a umí CdA přenést do kalkulačky nebo jako referenci k čelní ploše. Rozdíl mezi pozicemi ukazuje s 95% nejistotou z rozptylu jednotlivých kol (t-test se společným rozptylem), označí ho jako průkazný nebo v šumu a odhadne, kolik kol by bylo potřeba. Rozptyl kol v % srovná s opakovatelností ve větrném tunelu (inspirováno benchmarkem AiRO). **Korekce větru:** ruční zadání směru (odkud fouká, 8 směrů) a rychlosti v m/s. Údaj z předpovědi (10 m nad zemí) se násobí 0,65 na výšku jezdce, údaj z ručního anemometru se bere přímo. Směr jízdy se počítá z GPS v .fit souboru a odpor vzduchu z rychlosti vůči vzduchu. Na simulované jízdě s větrem 4 m/s vrátila korekce přesné CdA (bez korekce o 25 % vyšší). Nezachytí nárazy, závětří ani vliv bočního větru na CdA.

### Moje pozice (`history.js`, třetí záložka nahoře)
- Uložené pozice v čase: ve Výsledcích části Pozice a mobilita tlačítko **Uložit pozici** uloží úhly (z boku, zepředu, zezadu), mobilitu a údaje o jezdci. Fotky se neukládají.
- K pozici jde přiřadit čelní plochu (výběr varianty z Čelní plochy, změřené CdA varianty se převezme), změřené CdA (v CdA z jízdy tlačítko **Zapsat k pozici v Moje pozice**, nebo ručně) a pohodlí 1 až 10. Název a poznámka zůstávají jen v zařízení.
- **Srovnání** dvou zaškrtnutých pozic (před a po): úhly, plocha, CdA s přepočtem na watty, pohodlí, mobilita. Upozorní, když jsou pozice měřené jinak (fotky × video, stativ × z ruky).
- **Osobní model CdA** (od 4 pozic se změřeným CdA, spolehlivěji od 8 až 10): pro sklon trupu, úhel lokte, úhel ramene, šířku loktů a čelní plochu spočítá přímku CdA = a + b × ukazatel, vliv na CdA a watty s 95% nejistotou, R² a průkaznost. Nejlepší průkazný ukazatel odhadne CdA neměřených pozic (s nejistotou, označí odhad mimo změřený rozsah). Upozorní, když se dva ukazatele měnily spolu (korelace nad 0,8) a model je neoddělí.
- Data jsou v `localStorage` (`aero.pos.v1`). Tlačítka **Stáhnout zálohu** a **Načíst zálohu** (JSON).
- Sdílení: každá pozice jde do databáze jako jeden propojený řádek (`kind` = position, `schema_ver` = 2, náhodné `rid` záznamu), posílají se jen nové nebo změněné pozice, nejvýš 40 najednou.
- Otestováno v Playwrightu: uložení z výsledků, přiřazení plochy a CdA z jízdy, srovnání, model (vrátil nastavený vliv 0,003 m² na 1° trupu a správný odhad), varování při souvisejících ukazatelích, sdílení, záloha a obnova.

### Právní dokumenty a GDPR (stav 8. 11. 2026)
- **Okno s podmínkami při prvním spuštění** (`terms.js`, markup `#termsGate` v `index.html`): celé znění Podmínek použití (načítá se z `podminky.html`), povinné zaškrtnutí a tlačítko Pokračovat. Přijetí (verze, čas) se ukládá jen v zařízení (`aero.terms`). **Při změně podmínek zvýšit `AERO_TERMS_VER` v `boot.js`** (a jeho `?v=` v `index.html`; okno se ukáže znovu) a číslo `?v=` u `podminky.html` v `terms.js`. Souhlas s podmínkami je oddělený od souhlasu se sdílením dat (GDPR zakazuje souhlas přibalit k podmínkám).
- **Dokumenty:** `podminky.html` (Podmínky použití 1.0: účel, není zdravotnický prostředek podle MDR, věk 15+, pravidla, bezpečnost, licence, odpovědnost s ohledem na § 2898 OZ, změny, rozhodné právo), `soukromi.html` (Zásady ochrany osobních údajů 2.2 podle čl. 13 GDPR, včetně samoobslužné správy dat), `licence.html` (komponenty třetích stran, Apache 2.0). Společný vzhled `legal.css`, dají se vytisknout nebo uložit jako PDF.
- **Souhlas se sdílením** (`share.js`): výslovný souhlas včetně údajů o zdraví (mobilita, tělesné míry, tep) a věku 15+, verze `CONSENT_VER`. Starší souhlasy neplatí. Anonymní ID zařízení vzniká až se souhlasem. Ke každému odeslanému záznamu se přidává `consent` (verze a čas), aby šel souhlas doložit. **Při změně rozsahu sdílených dat zvýšit `CONSENT_VER`.**
- **Samoobslužná práva** (`mydata.js` na stránce Zásad, oddíl 12): stažení vlastních dat jako JSON (přístup, přenositelnost), smazání (výmaz) a odvolání souhlasu. Potřebuje funkce `get_my_data` a `delete_my_data` v databázi (konec `supabase/schema.sql`, otestováno na PostgreSQL 16).
- **Třetí strany:** knihovna MediaPipe a model detekce těla jsou hostované s aplikací (Apache 2.0, `vendor/mediapipe/LICENSE-Apache-2.0.txt`, `NOTICE.txt`). Jediné připojení k cizímu serveru je stažení modelu DeepLab od Googlu při použití obrysu čelní plochy (s kontrolou otisku SHA-256, viz Zabezpečení; jeho licenci se nepodařilo jednoznačně ověřit, proto se nešíří s aplikací; uvedeno v zásadách). Při spuštění aplikace se nepřipojuje k žádnému cizímu serveru (kromě hostingu GitHub Pages).
- **Interní dokumenty správce:** `docs/gdpr/zaznam-o-cinnostech-zpracovani.md` (záznam podle čl. 30 GDPR, posouzení rizik, proč není nutné DPIA) a `docs/gdpr/postup-pro-spravce.md` (co udělat hned, vyřizování žádostí, únik dat, roční kontrola, změny aplikace, co dát zkontrolovat právníkovi).
- Otestováno v Playwrightu (53 kontrol): okno s podmínkami na telefonu i tabletu, neovladatelnost aplikace před přijetím, opětovné zobrazení při nové verzi, žádná cizí připojení při spuštění, výslovný souhlas a jeho záznam, stažení, smazání a odvolání. Všechny dřívější testy funkcí prošly.

### Sdílení dat do výzkumné databáze (`share.js`, `soukromi.html`, `supabase/schema.sql`)
- Dobrovolné: pod výsledky (Pozice, CdA z jízdy, Výkon v pozici, Čelní plocha u variant se změřeným CdA) je zaškrtávátko souhlasu a tlačítko **Odeslat anonymně**. Souhlas platí pro všechna místa najednou a pamatuje se.
- Odesílají se jen čísla. Nikdy fotky, videa, poznámky, popisy pozic, názvy variant ani GPS. Vlastní názvy pozic se nahradí P1, P2…
- Každé zařízení má náhodné anonymní ID (`aero.device` v `localStorage`), podle kterého jde data na žádost smazat. Stejný výsledek se podruhé neodešle.
- Databáze: Supabase projekt `aero-pozice`, region Frankfurt (EU), tabulka `submissions` (device_id, kind = position / cda / power / area, schema_ver, data jako JSON). Tabulku vytváří `supabase/schema.sql` (vložit do SQL Editoru a spustit, jde spustit i opakovaně).
- Pravidla: aplikace (role anon) smí jen zapisovat, číst a mazat jen vlastník v Supabase. Databáze odmítne neplatná data, volný text a odeslání bez záznamu o souhlasu a hlídá limity (podrobně v části Zabezpečení). Ověřeno na PostgreSQL 16.
- V `share.js` je **publishable** klíč (veřejný, určený do webu). Secret / service_role klíč ani heslo databáze nikdy do kódu ani do chatu.
- Data najdeš v Supabase → Table Editor → `submissions` (jde exportovat do CSV). Smazání na žádost: SQL Editor → `delete from public.submissions where device_id = 'ID';`
- Zásady ochrany soukromí: `soukromi.html`. Správce dat: Filip Kovačević, aeroanalysisapp@gmail.com (odkaz na e-mail se předvyplní anonymním ID).
- Free tarif Supabase uspí projekt po týdnu bez aktivity, pak ho je potřeba v Supabase probudit (Restore).

### Zabezpečení (stav 8. 11. 2026, kolo 3)
- **Pravidla pro prohlížeč (CSP)** jsou v `<meta http-equiv="Content-Security-Policy">` na začátku `index.html`, `podminky.html`, `soukromi.html` a `licence.html`. Spustit jde jen JavaScript ze souborů aplikace, připojit se jen k vlastnímu webu, k `…supabase.co/rest/v1/` a k jednomu souboru modelu DeepLab u Googlu. **Nikdy nepřidávat skript přímo do HTML (`<script>…</script>`) ani atributy jako `onclick=`, prohlížeč by je zablokoval.** Veškerý kód patří do souborů `.js`. Nová připojení k cizím serverům je potřeba přidat do `connect-src`.
- **Ochrana proti vložení do cizí stránky** (`boot.js`, `legal.js`): když web někdo vloží do rámečku na svou stránku, obsah se skryje. GitHub Pages neumí poslat hlavičku `X-Frame-Options`, proto řešení přes skript.
- **Model DeepLab od Googlu** se stahuje s kontrolou otisku (`SEG_SRI` v `aero.js`). Když by ho Google změnil, aplikace ho odmítne s hláškou. Nový otisk: `openssl dgst -sha256 -binary deeplab_v3.tflite | base64` a předřadit `sha256-`.
- **Načtení zálohy** (`clean()` v `history.js`): převezme jen známé položky se správným typem, v úhlech a mírách jen čísla. Soubor nad 5 MB nebo víc než 1000 záznamů odmítne. Vadné záznamy vynechá a řekne kolik.
- **Soubory FIT:** nejvýš 50 MB, poškozený soubor skončí českou hláškou. Ověřeno 20 000 náhodně poškozenými soubory (nic se nezaseklo, nejdéle 11 ms).
- **Databáze** (`supabase/schema.sql`, části „Zpřísnění zabezpečení“): v datech smí být jen čísla, ano/ne a krátké hodnoty do 40 znaků z písmen, číslic a `._:-` (např. `fixed`, `P1`, datum, náhodné ID). Volný text, HTML, odkazy ani e-maily databáze nepřijme. Každý řádek musí mít `consent` s verzí a časem. Limity: 50 odeslání za den z jednoho zařízení, celkem 600 za hodinu a 5000 za den, tabulka nejvýš 300 MB. Pomocné funkce nejde volat zvenku. **Když se do sdílených dat přidá nové pole s textem, musí se do pravidla vejít, jinak ho databáze odmítne.** Hlášky z databáze (například překročený limit) aplikace ukáže uživateli.
- **Bezpečnostní test Strix** (`.github/workflows/strix.yml`, pokyny pro AI v `.github/strix-instrukce.md`): spouští se ručně v GitHubu (Actions → Bezpečnostní test (Strix) → Run workflow). Potřebuje placený klíč k AI (tajný údaj `LLM_API_KEY` v Settings → Secrets and variables → Actions) a model ve tvaru `poskytovatel/model`. Cena se omezí polem budget. Výsledek je v souhrnu běhu a protože je repozitář veřejný, uvidí ho i ostatní, nálezy proto hned opravit. Workflow nepoužívá žádné cizí akce a má jen právo číst.
- **Testy** (Playwright a PostgreSQL 16, mimo repozitář): CSP bez jediného porušení napříč aplikací a právními stránkami, ochrana proti rámečku, podvržený model, podvržená záloha s HTML a textem místo čísel, poškozený FIT, 14 skutečných odeslání z aplikace projde a 13 typů útoků na databázi neprojde, limity. Celkem 214 kontrol.
- **Kolo 4 (8. 11. 2026):** celá historie repozitáře (44 commitů) neobsahuje žádný tajný klíč, heslo ani soubor `.env`. Knihovna MediaPipe 0.10.14 nemá známé zranitelnosti (`npm audit`); novější verze existuje, ale zpracovává jen fotky v prohlížeči a model s otiskem, proto přechod není naléhavý. Přidán `SECURITY.md` (kam hlásit bezpečnostní chyby) a měsíční záloha a kontrola zneužití v postupu pro správce. Zjištění: u 11 commitů z webu GitHubu je vidět osobní e-mail autora; oprava v nastavení GitHubu (Settings → Emails → Keep my email addresses private).
- **Ručně v Supabase (správce), hotovo 8. 11. 2026:** nové části `schema.sql` jsou spuštěné (ověřeno na živé databázi: volný text a zápis bez souhlasu odmítne, data z aplikace přijme) a registrace uživatelů je vypnutá. Na konci `schema.sql` je kontrola, která po spuštění celého souboru ukáže „Ochrana je zapnutá“.

## Důležitá rozhodnutí a proč

- **Webová aplikace, ne nativní Android:** na tabletu nejde Android Studio a nativní vývoj by začátečníka zastavil. Web se navíc nahrává jedním souborem.
- **CFD simulace z fotek není reálná.** Z fotek vzniká kostra, ne povrch těla, a CFD by dalo vymyšlené CdA. Čelní plocha vysvětluje jen asi polovinu rozdílů v CdA mezi jezdci a se součinitelem tvaru nesouvisí. Proto se používá kombinace: odhad plochy z fotky, osobní kalibrace a skutečné měření z jízdy.
- **Skutečné CdA lze získat jen měřením:** větrný tunel, velodrom, nebo jízda venku metodou virtual elevation. V zimě (kdy se venku nejezdí) zůstává trenažér pro čelní plochu a test výkonu v pozici. Venkovní test CdA stačí 30 až 45 minut v jeden suchý bezvětrný den.
- **Pásma mobility a limit 85 %** jsou orientační pravidla autora kódu, ne klinické normy.
- **3D tisk a karbon:** mohou se vytvářet parametrické modely (podložky loktů, distanční vložky, držáky) v kódu a exportovat do STL. Nosné díly kokpitu (nástavce, risery) nevyvíjet bez pevnostních zkoušek: porucha při rychlosti znamená pád. Nekopírovat konkrétní produkty výrobců.

## Jak nahrávat změny

Normální postup: změna v repozitáři `zkovacevicfilip-del/test` na větvi `main` přes Claude Code. Po nahrání GitHub Pages web znovu sestaví (1 až 3 minuty). Když prohlížeč ukazuje starou verzi, otevři odkaz s `?v=číslo` na konci.

Ruční nahrání (nouzově): na GitHubu Add file → Upload files → Commit changes. Soubor se musí jmenovat přesně `index.html`, ne `index (1).html`.

## Automatické testy

Spouští se jedním příkazem `npm test` v Claude Code (soubory `tests/run.js` a `tests/data.js`, běh asi 15 s). Nic se neinstaluje, Playwright s prohlížečem je v cloudovém prostředí předinstalovaný. Na tabletu samotném spustit nejdou.

- **Co kontrolují** (na šířce 412 a 1000 px): načtení bez chyb v konzoli a bez porušení CSP, okno s podmínkami (blokuje aplikaci, po přijetí zmizí), přepnutí tří částí hlavním menu, kalkulačku wattů proti nezávislému výpočtu v testu, načtení zálohy (platný soubor přijme, vadné odmítne).
- **Testovací data** vyrábí skript `tests/data.js`, jsou to vymyšlená čísla.
- **Co zatím nepokrývají:** měření úhlů z fotek a videí (detekce bodů těla), čelní plochu z fotky, výkon v pozici, CdA z jízdy a soubory `.fit`, databázi a sdílení dat, stránky Podmínek a Zásad (včetně správy vlastních dat), stažení zálohy, uložení pozice z výsledků, srovnání pozic a osobní model, instalaci na plochu, vzhled (testy neporovnávají snímky) a jiné prohlížeče než Chromium.

## Co nebylo ověřeno na skutečných datech

Tohle prostředí nemá přístup ke stahování modelů a Claude nemá k dispozici skutečné fotky ani soubory autora. Otestováno bylo na simulovaných `.fit` souborech se známým CdA (aplikace je vrátila přesně) a na testovacím obrázku s náhradním segmentačním modelem. Neověřeno zůstává:
- načtení modelu MediaPipe a automatická detekce těla na skutečných fotkách (s helmou a kombinézou),
- zpracování videa na tabletu (výkon a přetáčení),
- obrys těla z modelu DeepLab,
- skutečné `.fit` soubory z Garminu (obsahují víc typů zpráv než testovací),
- oprava ručního výběru bodů zepředu (klepnutí chytalo sousední bod, opraveno, uživatel zatím nepotvrdil).

Chybové hlášky se zobrazují přímo pod náhledem. Když se objeví, je nejlepší opsat jejich text.

## Známá omezení

- Čelní plocha se nepočítá z pozice kostry, ale z obrysu a jen na fotce zepředu. Odhad CdA platí jen pro malé změny pozice, ne pro jinou helmu nebo kombinézu.
- Z pohledu zezadu může model zaměnit levou a pravou stranu.
- U bočních fotek musí být měřená noha dole. Vybočení kolen zepředu a zezadu závisí na poloze kliky.
- Korekce perspektivy neřeší hlubokou perspektivu. Zepředu a zezadu musí být telefon přesně vodorovně.
- Video z ruky kazí úhly, nejlepší je stativ nebo podložka.
- Detekce je konzistentní, ne dokonale přesná. Porovnání před a po je spolehlivější než absolutní čísla.
- Aplikace běží v prohlížeči, nemá přístup k Bluetooth ani ANT+ senzorům. Data se zadávají z `.fit` souborů nebo ručně.

## Další kroky (v pořadí priority)

1. ~~Instalovatelná PWA pro Android~~ (hotovo, offline režim později odstraněn, viz Instalace).
2. **Web Bluetooth pro wattmetr** (BLE Cycling Power) a případně tepový pás: záznam výkonu a kadence přímo v záložce Výkon v pozici, tlačítka Interval start a stop, automatické přiřazení k pozici. ANT+ z webu nejde. Nativní ANT+ vyžaduje zařízení s ANT rádiem nebo USB klíč s OTG, takže se řešit zatím nebude. Nejdřív zjistit, jestli wattmetr a trenažér vysílají přes Bluetooth.
3. Otestovat aplikaci na skutečných fotkách, videích a `.fit` souborech a podle chybových hlášek opravit.
4. ~~Ukládání výsledků pozic a mobility v čase~~ (hotovo, viz Moje pozice).
5. Případně vlastní návrhy 3D tištěných dílů (tvarované podložky loktů z TPU, držáky) podle změřené pozice. Nosné karbonové díly nechat výrobci.
