# Aero pozice na časovkářském kole

Webová aplikace pro zlepšení aerodynamické pozice na časovkářském kole. Běží celá v prohlížeči (žádný server, žádné účty), fotky a data se nikam neodesílají. Je určená jen pro osobní použití.

- Web: https://zkovacevicfilip-del.github.io/test/ (GitHub Pages z větve `main`, složka root)
- Soubory: `index.html` (stránka, část Pozice a mobilita, styly), `aero.js` (část Aero a výkon)

> Toto README je předávací shrnutí dosavadního vývoje, aby nový chat s Claude přesně věděl, v jaké fázi projekt je.

## Kontext a pravidla spolupráce

- Autor je začátečník bez zkušeností s programováním, pracuje na **Android tabletu** (bez PC), píše česky.
- Odpovídej česky, stručně (čte se na tabletu), buď kritický a upozorni, když je něco nerealistické. Když něco nevíš, doptej se.
- Kód dodávej celý a testuj ho (Playwright je v prostředí k dispozici). Změny nahrávej na `main` v repozitáři `zkovacevicfilip-del/test`.
- Má předplatné Claude Pro. Limity se sdílí mezi chatem a Claude Code a obnovují se po 5 hodinách, proto drž úkoly malé a konkrétní.
- Nikdy nežádat heslo ani přístupový token ke GitHubu.

## Cíl projektu

Z fotek a videí ze čtyř pohledů (levá strana, pravá strana, zepředu, zezadu) automaticky najít klíčové body těla, spočítat úhly, ověřit je proti vlastní mobilitě a navrhnout malé úpravy pozice a vybavení. Hlídá se komfort a to, aby pozice neomezovala výkon z nohou. Navíc spočítat watty z CdA a CdA změřit z jízdy.

## Co aplikace dnes umí

### Část Pozice a mobilita (`index.html`)
- Volba režimu: **pevné stanoviště** (stativ, bez korekce) nebo **z ruky s korekcí perspektivy** (u bočních pohledů se označí osy a okraje předního kola, aplikace srovná náklon a vodorovné zkreslení).
- Pohledy levá, pravá, zepředu, zezadu. U každého fotka z galerie, fotoaparát, nebo **video** (až 90 snímků, statistiky přes celý cyklus šlapání).
- **Automatická detekce těla** (MediaPipe Pose Landmarker 0.10.14 z jsdelivr, model `pose_landmarker_full` z storage.googleapis.com). Ruční označení bodů je vypnuté, zapne se jen při selhání detekce nebo zaškrtnutím. Do textu pro Claude se uvede, že byly body upraveny ručně.
- Z boku: koleno, kyčel, sklon trupu, loket, rameno (levá, pravá, rozdíl, zvýrazněno nad 5°). U videa koleno dole a nahoře, kyčel nejvíc zavřená a otevřená, rozkmit trupu.
- Zepředu a zezadu: sklon ramen, sklon pánve, boční náklon trupu, vybočení kolen, poměry šířek (jen zepředu).
- **Mobilita:** čtyři testy z boku (kyčel koleno k hrudi, rameno paže nad hlavu, kotník koleno k zdi, předklon vsedě). Limit pro pozici je 85 % maxima. Aplikace ukáže rezervu nebo nedostatek v ° a určí oblast, kterou má smysl zlepšit.
- Výstup: hotový text s údaji, výsledky a prosbou o rady, který se zkopíruje do Claude.

### Část Aero a výkon (`aero.js`)
1. **Kalkulačka:** z CdA, hmotnosti, Crr, teploty, nadmořské výšky a účinnosti spočítá watty při zvolené rychlosti (výchozí 40 km/h), rozpad na aero, valivý odpor a ztráty, čas na zadanou vzdálenost a tabulku citlivosti na změnu CdA. Pro orientaci: 0,01 m² CdA ≈ 8 W při 40 km/h.
2. **Čelní plocha z fotky zepředu:** segmentace obrysu (MediaPipe ImageSegmenter, DeepLab), měřítko podle listu A4 nebo předního kola, ukládání variant, srovnání v %. Při zadaném změřeném CdA referenční varianty spočítá osobní Cd = CdA / plocha a odhadne CdA a watty ostatních variant.
3. **Výkon v pozici:** tři pevné pozice (1 současná jako reference, 2 a 3 s popisem, který se doplňuje až po měření). Doporučený protokol: 6 intervalů po 8 min v pořadí 1, 2, 3, 3, 2, 1. Data buď z `.fit` (vlastní parser FIT), nebo ručně. Srovnání výkonu, tepu, W/tep, kadence a subjektivního pohodlí (1 až 10). Data se ukládají v `localStorage`.
4. **CdA z jízdy (virtual elevation):** z venkovního `.fit` souboru (okruh, kola oddělená tlačítkem Lap) metodou nejmenších čtverců odhadne CdA pro každou pozici a Crr, ukáže graf virtuální vs. skutečné výšky a umí CdA přenést do kalkulačky nebo jako referenci k čelní ploše.

## Důležitá rozhodnutí a proč

- **Webová aplikace, ne nativní Android:** na tabletu nejde Android Studio a nativní vývoj by začátečníka zastavil. Web se navíc nahrává jedním souborem.
- **CFD simulace z fotek není reálná.** Z fotek vzniká kostra, ne povrch těla, a CFD by dalo vymyšlené CdA. Čelní plocha vysvětluje jen asi polovinu rozdílů v CdA mezi jezdci a se součinitelem tvaru nesouvisí. Proto se používá kombinace: odhad plochy z fotky, osobní kalibrace a skutečné měření z jízdy.
- **Skutečné CdA lze získat jen měřením:** větrný tunel, velodrom, nebo jízda venku metodou virtual elevation. V zimě (kdy se venku nejezdí) zůstává trenažér pro čelní plochu a test výkonu v pozici. Venkovní test CdA stačí 30 až 45 minut v jeden suchý bezvětrný den.
- **Pásma mobility a limit 85 %** jsou orientační pravidla autora kódu, ne klinické normy.
- **3D tisk a karbon:** mohou se vytvářet parametrické modely (podložky loktů, distanční vložky, držáky) v kódu a exportovat do STL. Nosné díly kokpitu (nástavce, risery) nevyvíjet bez pevnostních zkoušek: porucha při rychlosti znamená pád. Nekopírovat konkrétní produkty výrobců.

## Jak nahrávat změny

Normální postup: změna v repozitáři `zkovacevicfilip-del/test` na větvi `main` přes Claude Code. Po nahrání GitHub Pages web znovu sestaví (1 až 3 minuty). Když prohlížeč ukazuje starou verzi, otevři odkaz s `?v=číslo` na konci.

Ruční nahrání (nouzově): na GitHubu Add file → Upload files → Commit changes. Soubor se musí jmenovat přesně `index.html`, ne `index (1).html`.

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

1. **Instalovatelná PWA pro Android:** manifest, ikony, service worker s offline režimem a cache modelu MediaPipe z CDN (verzování cache, aby se nová verze projevila, a zachování dat v `localStorage`). Otestovat v Playwrightu včetně offline režimu.
2. **Web Bluetooth pro wattmetr** (BLE Cycling Power) a případně tepový pás: záznam výkonu a kadence přímo v záložce Výkon v pozici, tlačítka Interval start a stop, automatické přiřazení k pozici. ANT+ z webu nejde. Nativní ANT+ vyžaduje zařízení s ANT rádiem nebo USB klíč s OTG, takže se řešit zatím nebude. Nejdřív zjistit, jestli wattmetr a trenažér vysílají přes Bluetooth.
3. Otestovat aplikaci na skutečných fotkách, videích a `.fit` souborech a podle chybových hlášek opravit.
4. Ukládání výsledků pozic a mobility v čase (srovnání před a po úpravě).
5. Případně vlastní návrhy 3D tištěných dílů (tvarované podložky loktů z TPU, držáky) podle změřené pozice. Nosné karbonové díly nechat výrobci.
