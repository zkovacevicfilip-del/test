# Šablona: vysvětlovací aero video (Instagram Reels, 9:16)

Tahle složka je **sada na výrobu videí ve stejném stylu jako „What is CdA“**. Styl, hlas, titulky,
pohyb a export jsou hotové v kódu. Pro nové video se píší jen dva soubory: `script.json` (co se říká)
a `scenes.js` (co je vidět). Všechno ostatní udělá `build.sh`.

## 0. Jak to použít (pro autora)

Do nového chatu v Claude Code (repozitář `test`) vlož:

```
Přečti video-kit/SABLONA.md a přesně podle ní vyrob nové video.
Téma: <o čem má video být>
Úvodní věta (hook): <první věta, nebo „navrhni 3 a vyber nejlepší“>
```

Nic dalšího není potřeba. Model má před renderem ukázat scénář a náhledové archy.
Pro krátké video (asi 30 s) připiš „krátká verze“ a platí oddíl 11.

## 1. Co je pevně dané (neměnit, pokud o to autor výslovně neřekne)

| Věc | Hodnota |
|---|---|
| Formát | 1080 × 1920 (9:16), 30 fps, MP4 H.264 + AAC, do 60 MB |
| Délka | 55 až 70 s (příklad: 63,6 s). Kratší než 50 s nebo delší než 75 s = přepsat scénář. Krátká verze: 25 až 33 s (oddíl 11) |
| Jazyk | angličtina (hlas i texty na obraze) |
| Barvy | pozadí Track black `#17191B`, text Chalk grey `#E4E3DE`, zvýraznění Electric purple `#8B3DFF`, tlumený text `#9A9A98`. Žádná jiná barva |
| Písma | Unbounded 700/800 (velká čísla a nadpisy), Inter 600/700/800 (podnadpisy, popisky, titulky) |
| Hlas | ElevenLabs „Liam – Energetic, Social Media Creator“, `voice_id TX3LPaxmHKxFdv7VOQHJ`, model `eleven_multilingual_v2`, stability 0,45 · similarity 0,8 · style 0,35 · speaker boost |
| Titulky | Inter 800, 58 px, dole na tmavém podkladu, 2 až 5 slov, přesně na slovo hlasu (z rozpoznání řeči) |
| Pohyb | rychlý nástup a pomalé dorovnání (`pop`, `popS`). **Nikdy lineární** nástup ani odchod |
| Grafika | jednoduchá 2D, proudění = částice unášené simulovaným polem (pomalé fialové, rychlé světlé) |
| Zvuk | jen hlas a tiché „whoosh“ na přechodech aktů. Žádná hudba |
| Aplikace | video **nezmiňuje** aplikaci wattIF (dříve Aero pozice) ani její logo. Jediná výjimka (autor 17. 11. 2026): úvodní nápis **wattIF** místo whatIF u videí ze série, která ho mají zapnutý v popisu (`style.hook: 'watt'`); hlas dál říká „What if“. Jiné zmínky jen na výslovné přání autora (pak uprav i kontrolu v `tests/video-kit.js`) |
| Čísla | každé číslo je spočítané (`tools/physics.py`) nebo učebnicové a má uvedený zdroj. Nic se neodhaduje |

## 2. Soubory

```
video-kit/
  SABLONA.md        tenhle návod
  build.sh          jediný příkaz na všechno
  script.json       ← PÍŠEŠ: text hlasu, titulky, akty
  scenes.js         ← PÍŠEŠ: scény (co je kdy vidět)
  examples/what-is-cda/   vzor: script.json a scenes.js hotového videa (neměnit, opisovat z něj)
  engine/           motor: kreslení, titulky, částice, render (NEMĚNIT)
  tools/            hlas, přepis, časová osa, zvuk, náhledy, physics.py (NEMĚNIT)
  sim/              simulace proudění (NEMĚNIT)
  work/             pracovní soubory a hotové video (není v gitu, vzniká znovu)
```

## 3. Postup krok za krokem

Spouštěj z kořene repozitáře. Kroky nevynechávej a nepřeskakuj pořadí.

1. **Příprava** (jednou za session, na pozadí, celkem asi 12 minut):
   `bash video-kit/build.sh setup` a potom `bash video-kit/build.sh sims`.
   Mezitím piš scénář.
2. **Čísla.** Všechna čísla do videa spočítej: `python3 video-kit/tools/physics.py 250 0.30 0.25`
   (watty, horší CdA, lepší CdA, volitelně km a kg). Vypíše rychlosti, časy, podíl vzduchu a watty na 0,01 m².
3. **Scénář.** Přepiš `video-kit/script.json` podle oddílu 4. Ukaž autorovi anglický text a česky jednou
   větou, o čem každý akt je. Pokud autor zadal jen téma, nečekej na schválení a pokračuj.
4. **Hlas a časová osa:** `bash video-kit/build.sh voice`
   - Vypíše přepis toho, co hlas opravdu řekl. **Porovnej ho s textem.** Špatně přečtené slovo
     oprav v `say` (jiný zápis, třeba `C-D-A`) a spusť znovu. Hotové věty se negenerují podruhé.
   - Když skončí hláškou `POZOR, titulky bez přesného času`, doplň u vypsaného titulku kotvu (oddíl 4).
   - Vypíše délku videa. Mimo 55 až 70 s uprav scénář.
5. **Scény.** Přepiš `video-kit/scenes.js` podle oddílu 5. Začni kopií vzoru a měň scény po jedné.
6. **Náhled:** `bash video-kit/build.sh preview` (asi 30 s). Otevři **každý** arch
   `video-kit/work/stills/sheet-*.jpg` nástrojem Read a zkontroluj podle oddílu 6. Opravuj a opakuj,
   dokud není čisto. Hláška `PŘETÉKÁ MIMO OBRAZ` = text je moc široký, zmenši ho nebo zkrať.
7. **Render:** `bash video-kit/build.sh render` (asi 12 minut, spusť na pozadí).
   Výsledek: `video-kit/work/out/<title>.mp4`.
8. **Odevzdání** podle oddílu 9.

## 4. Scénář (`script.json`)

Vzor: `examples/what-is-cda/script.json`. Pole `voice` a `timing` nech beze změny.

**Stavba (6 až 8 aktů, 9 až 11 vět, 140 až 160 slov):**

| Akt | Úkol | Vzor |
|---|---|---|
| 1 hook | jedna věta, která zastaví palec: číslo, které překvapí, nebo „99% of people don't know…“ | `hook` |
| 2 proč mě to zajímá | co z toho má jezdec (rychlost, watty, čas) | `rider` |
| 3 až 5 vysvětlení | od základu, jedna myšlenka na akt, vždy s obrazem | `shapes`, `area`, `equation` |
| 6 důkaz | konkrétní spočítaný příklad (stejný jezdec, stejné watty) | `race` |
| 7 co s tím | 2 až 3 kroky, které může divák udělat, a krátká pointa | `tuck` |

**Pravidla textu:**
- Krátké věty, běžná slova, druhá osoba („you“). Žádné „in this video“, žádný pozdrav, žádná výzva k odběru.
- Jedna věta = jeden řádek v `lines`. Věta má nejvýš asi 25 slov (delší rozděl do dvou řádků).
- V `say` piš **čísla slovy** (`eighty-five percent`, `two hundred fifty watts`) a **zkratky po písmenech
  s pomlčkami** (`C-D-A`, `C-D`). Jinak je hlas přečte špatně.
- Nepřeháněj: „about“, „roughly“ u zaokrouhlených čísel. Žádné sliby výsledků.

**Titulky (`chunks`):**
- Rozsekej větu na kousky po 2 až 5 slovech, v pořadí, bez vynechání. Řež tam, kde se přirozeně dýchá.
- Titulek smí vypadat jinak než hlas (`85%` místo `eighty-five percent`, `CdA` místo `C-D-A`).
- Čas titulku se bere z prvního slova. Když titulek **nezačíná slovem, které hlas řekne**, zapiš ho jako
  dvojici `["text na obraze", "KOTVA"]`, kde KOTVA je první vyslovené slovo velkými písmeny, jak ho
  zapíše přepis. Víc možností odděl svislítkem. Příklady ze vzoru:
  `["99% of people", "NINETY"]`, `["2 km/h faster.", "TWO"]`, `["3½ minutes", "THREE"]`, `["CdA means…", "CDA|CDM"]`.
- U hooku dej `"captions": false`: text je velký přímo ve scéně.

**Akty:** `"acts": [{ "id": "hook", "lines": ["hook"] }, …]`. Každé `id` musí mít scénu ve `scenes.js`.
`title` je název výsledného souboru (malá písmena a pomlčky).

## 5. Scény (`scenes.js`)

Vzor: `examples/what-is-cda/scenes.js`. Soubor musí na konci definovat `SCENES`, `AMBIENT` a `FLOWS`.
Scéna je funkce `(t, a)`: `t` = čas videa v sekundách, `a` = akt `{id, start, end}`.

### Rozvržení (souřadnice v ploše 1080 × 1920 před zvětšením)

Celá scéna se sama zvětšuje 1,2× kolem bodu (540, 905). Proto je vidět jen **x 100 až 980, y 110 až 1700**.

| Pásmo | y | Co tam patří |
|---|---|---|
| nadpis | 300 až 500 | velké číslo nebo nadpis (účaří kolem 390), podnadpis (kolem 470) |
| obraz | 560 až 1330 | panel s prouděním, jezdec, graf. Zem pod jezdcem je y 1322 |
| titulky | 1468 | kreslí se samy, nic jiného sem nedávej (y 1380 až 1560 nech volné) |

Střed je x 540. Text nesmí být širší než 880 px (hlídá to `preview`).

### Velikosti písma

| Prvek | Nastavení |
|---|---|
| velké číslo / pojem | `{ size: 150–250, w: 800, f: F.U, c: C.pu, ls: -4 až -8 }` |
| nadpis | `{ size: 78–92, w: 700, f: F.U, ls: -2 }` |
| podnadpis | `{ size: 46–58, w: 700 }`, tlumený `c: C.muted` |
| popisek verzálkami | `{ size: 28–36, w: 800, c: C.muted, ls: 2–5 }` |
| štítek | `pill(text, x, y, { size: 36–42 })` |

### Časování (nejdůležitější pravidlo)

**Nikdy nepiš čas číslem.** Každý prvek se objeví ve chvíli, kdy o něm hlas mluví:
- `cs('klíč_věty', i)` = začátek i-tého titulku věty (počítá se od 0),
- `L.klíč.start`, `L.klíč.end` = začátek a konec věty, `a.start`, `a.end` = začátek a konec aktu.

Velké číslo ať naskočí přesně s titulkem, ve kterém zazní. Podnadpis o 0,15 až 0,3 s později.

### Pomůcky z motoru

| Funkce | Co dělá |
|---|---|
| `txt(text, x, y, o)` | text. `o`: `size`, `w` (váha), `f` (`F.U` / `F.I`), `c` (barva), `a` (průhlednost), `s` (měřítko), `ls` (prostrkání), `align` (`'left'`, `'right'`, jinak střed) |
| `rich([[text, barva], …], x, y, o)` | jeden řádek ve více barvách, na střed |
| `width(text, o)` | šířka textu v px |
| `pop(t, kdy, konec)` | nástup zdola s dorovnáním. Vrací `{a, dy}`: `txt(…, y + p.dy, { a: p.a })`. `konec` = čas odchodu, nebo `null` (zmizí s aktem) |
| `popS(t, kdy, konec)` | nástup zvětšením s překmitem (velká čísla, štítky). Vrací `{a, s, dy}` |
| `actIO(t, a)` | nástup a odchod celého aktu. Vrací `{a, dy}`: na začátku scény `ctx.globalAlpha = io.a` a k y obrazu přičti `io.dy` |
| `tw(t, start, délka, E.expo)` | průběh 0 → 1 od `start`. Křivky: `E.expo`, `E.quint`, `E.back` (překmit), `E.io` (plynulý rozjezd i dojezd, jen pro dlouhé pohyby jako závod) |
| `lerp(a, b, k)`, `clamp(x)`, `mix(RGB.ink, RGB.pu, k)` | prolnutí čísel a barev |
| `pill(text, x, y, { a, s, size, bg, c })` | zaoblený štítek |
| `arrow(x, y, délka, barva, a)` | šipka doprava |
| `panel(FLOW.jméno, cy, výška, a)` | pruh s prouděním přes celou šířku, střed v `cy` |
| `frontRider(x, zem, měřítko, { back, elbows, head }, výplň, a)` | časovkář zepředu. Hodnoty 0 až 1 ho skládají do nižší a užší pozice |
| `riderImg` | silueta jezdce z boku: `ctx.drawImage(riderImg, x, y, š, v)` |
| `C`, `RGB`, `F` | barvy a písma. Jiné barvy nepoužívej |

Počítadlo čísla: `Math.round(85 * tw(t, kdy, 1.0, E.quint))`.
Vlastní tvary (čáry, pruhy grafu) kresli přes `ctx` mezi `ctx.save()` a `ctx.restore()`.

### Proudění

| Jméno | Co je vidět | Kdy použít |
|---|---|---|
| `rider` | jezdec z boku, vítr zleva, úplav za zády | odpor jezdce, „vzduch tě brzdí“ |
| `cyl` | tupý tvar (válec), vírová stezka | úplav, turbulence, špatný tvar |
| `drop` | hladký proudnicový tvar, tenký úplav | dobrý tvar, srovnání s `cyl` |

Ve `FLOWS` uveď jen ta, která scény používají, a kdy běží:
`rider: { count: 3400, from: () => ACT.rider.start, to: () => ACT.rider.end }`.
`drop` je idealizované proudění (ne přesné CFD): netvrď o něm přesná čísla.
Nový tvar proudění znamená úpravu `sim/lbm.py` a 5 až 10 minut výpočtu. Dělej to jen na výslovné přání.

`AMBIENT` = jak silně je v aktu vidět jemný proud vzduchu v pozadí: 0,3 až 0,4 u aktů jen s textem,
0,13 až 0,22 tam, kde je panel nebo jezdec.

### Hotové vzory scén (opiš a změň texty)

| Potřebuješ | Opiš ze vzoru |
|---|---|
| hook: obří číslo a pojem přes celou obrazovku | `sHook` |
| proudění + nadpis + počítadlo procent + pruh podílu | `sRider` |
| srovnání dvou tvarů nad sebou se štítky hodnot | `sShapes` |
| jezdec zepředu, zvýraznění plochy, štítek s čárkou | `sArea` |
| dva pojmy, které se spojí v jeden (vzorec) | `sEq` |
| závod dvou jezdců s cílovou čárou a rozdílem | `sRace` |
| seznam kroků s odškrtnutím + jezdec, který mění pozici | `sTuck` |

**Pravidla kompozice:** jedna myšlenka na akt. Najednou nejvýš jeden obraz a 2 až 3 texty.
Fialová jen na to hlavní (jedno číslo nebo pojem). Text ve scéně neopakuje titulek slovo od slova,
shrnuje ho (titulek „about 85% of your effort“ → ve scéně `85%` a „of your effort fights the air“).
Starý text musí odejít dřív, než na jeho místo přijde nový (`konec` u `pop`).

## 6. Kontrola před renderem (archy z `preview`)

Arch ukazuje prostředek a konec každé věty. U každého políčka ověř:

- [ ] žádný text se nepřekrývá s jiným textem ani s obrazem,
- [ ] nic není uříznuté okrajem a `preview` nehlásí `PŘETÉKÁ MIMO OBRAZ`,
- [ ] na konci věty je vidět všechno, o čem věta mluvila (nic nechybí, nic nezůstalo z minula),
- [ ] titulek má volné místo (nic pod ním neprosvítá),
- [ ] čísla na obraze = čísla v hlase = výstup `physics.py`,
- [ ] jen tři barvy, žádná zmínka o aplikaci,
- [ ] přepis z kroku `voice` odpovídá textu (zkratky a čísla přečtené správně),
- [ ] délka 55 až 70 s (krátká verze 25 až 33 s),
- [ ] ve výpisu `voice` není věta nápadně delší, než odpovídá počtu slov (asi 3 slova za sekundu). Delší = pauza nebo cvaknutí, viz oddíl 8,
- [ ] na konci videa není víc než sekunda bez děje.

Po renderu: `build.sh` musí vypsat `width=1080|height=1920` a `VIDEO: …`. Otevři 3 snímky
z `video-kit/work/frames/` (začátek, střed, konec) a zkontroluj, že odpovídají archům.

## 7. Hlas a klíč

- Klíč k ElevenLabs je uložený v nastavení prostředí a do požadavků ho doplňuje síť sama.
  **Nikdy ho nechtěj do chatu ani ho nepiš do souboru.**
- Když `voice` skončí chybou 401/403: požádej o klíč nástrojem `request_credential`
  (host `api.elevenlabs.io`, hlavička `xi-api-key`) a spusť krok znovu.
- Jedno video spotřebuje asi 900 znaků. Opravy generují jen změněné věty.
- Bez klíče (nouzově, horší hlas): v `script.json` nastav `"provider": "kokoro"`, `"voice_id": "am_michael"`,
  nainstaluj `video-kit/work/env/bin/pip install kokoro-onnx` a do `video-kit/work/kokoro/` stáhni
  `kokoro-v1.0.onnx` a `voices-v1.0.bin` z vydání `model-files-v1.0` projektu `thewh1teagle/kokoro-onnx`.
  Autorovi napiš, že hlas není Liam.
- **Náš hlas ze stránky `video-kit/tts`** (lepší než nouzový Kokoro výše, stejný jako na stránce: směs hlasů,
  živý přednes, stoupání u otázek): v popisu videa ze série napiš `voice: 'ours'`, nebo celou dávku spusť
  s proměnnou `VOICE=ours`. Krok `voice` projde stránku v prohlížeči bez okna (`tools/kokoro-page.js`),
  model (asi 90 MB) se stáhne při každém spuštění. Nepoužívej trvalý profil prohlížeče ani podstrkování
  modelu přes `page.route`: první občas hlásí „Failed to execute 'match' on 'Cache'“ a zasekne se,
  druhé shodí stránku. Přepis řeči (`asrdiff.py`) u tohohle hlasu častěji slyší jinak krátká slova
  (riders → writers, tuck → talk): je to chyba přepisu, stačí kotva titulku (`['Tuck only where', 'TALK|TUCK']`).

## 8. Časté chyby

| Chyba | Oprava |
|---|---|
| hlas čte „CdA“ jako slovo | v `say` piš `C-D-A` |
| titulek naskočí pozdě nebo brzy | chybí kotva: `["85% …", "EIGHTY"]` |
| text přes okraj po zvětšení | drž x 100 až 980, zmenši `size` |
| scéna po renderu po částech „poskočí“ | scéna používá `Math.random()` nebo čas mimo `t`. Vše musí záviset jen na `t` |
| chybí simulace / časová osa | `build.sh` napíše, který krok spustit dřív |
| preview vypíše `CHYBA … chybí scéna pro akt` | `id` aktu ve `script.json` nemá položku v `SCENES` nebo `AMBIENT` |
| server na portu 8140 neodpovídá | `build.sh` si ho na dobu kroku spustí a pak zase vypne, stačí krok zopakovat |
| preview vypíše `CHYBA … is not defined` nebo `Cannot read properties of undefined` | překlep ve `scenes.js` (jméno funkce, věty nebo proměnné). Klíče vět v `cs('…')` musí být stejné jako ve `script.json` |
| ve videu je mezi větami cvaknutí a ticho | ElevenLabs občas přidá na konec věty ticho a cvak. `voice` to ořízne sám (vypíše „oříznuto“). Kdyby zůstalo, smaž `work/tts/<věta>.wav` a spusť `voice` znovu |
| hlas dělá uvnitř věty dlouhé pauzy (za „?“ a „!“), nezní lidsky | do `timing` přidej `"max_pause": 0.35`. Hlas se negeneruje znovu |
| na konci videa se sekundu a víc nic neděje | zmenši `tail` v `timing` (krátká verze 0,9) |
| přepis má jiné slovo, které zní stejně (aero → ARROW, weight → WAIT, riders → WRITERS, a → AH) | výslovnost je v pořádku, jen doplň kotvu s oběma zápisy: `["aero wins.", "AERO\|ARROW"]`. Text `say` neměň |
| velký text ve scéně a titulek říkají totéž | u té věty dej `"captions": false` (jako u hooku) |
| po úpravě `tools/` se kopie sady ve `work/kits/` chová postaru | kopie má vlastní `tools/`: zkopíruj je znovu |
| lineární pohyb | nepoužívej `clamp((t - a) / d)` pro pozici, jen pro průhlednost. Pozice vždy přes `tw` |

## 9. Odevzdání

1. Video pošli autorovi jako soubor (`video-kit/work/out/<title>.mp4`).
2. Přilož text hlasu s časy a oddíl „Odkud jsou čísla“ (předpoklady z `physics.py`, učebnicové hodnoty).
3. Ulož scénář a scény nového videa do `video-kit/examples/<title>/` (jen `script.json` a `scenes.js`),
   spusť `npm test` (kontroluje i scénář a scény), commitni a nahraj. **Video, hlas ani snímky do repozitáře nepatří** (`work/` je v `.gitignore`).
4. Česky a stručně napiš: délku, co ve videu je, co si má autor pustit a zkontrolovat, co se ověřit nepodařilo.

## 10. Na rovinu: co šablona zaručí a co ne

- **Zaručí:** stejný formát, barvy, písma, hlas, titulky na slovo, styl pohybu, proudění a export.
  Vzorové video z ní vyjde shodné s originálem.
- **Nezaručí:** kvalitu scénáře a nových scén. Ty píše model a slabší model je napíše hůř.
  Proto je tu povinný náhled a kontrolní seznam. Čím víc se nové video drží hotových vzorů scén, tím jistější výsledek.
- Příprava v nové session trvá asi 12 minut (simulace se do repozitáře neukládají, mají 95 MB).

## 11. Krátká verze (asi 30 s)

Vzory: `examples/why-40-feels-brutal`, `lighter-bike-myth`, `drag-is-behind-you`, `same-power-3-minutes`, `three-free-fixes`.
Dalších pět vzorů ze série „What if“ je v `examples/what-if-*`.
Platí všechno výše, jen s těmito rozdíly:

| Věc | Krátká verze |
|---|---|
| `script.json` | navíc `"format": "short"` (test pak čeká 55 až 90 slov a krátký hook) |
| Délka | 25 až 33 s, 3 až 4 akty, 5 až 7 vět, 60 až 85 slov |
| Stavba | hook → jedna myšlenka s jedním číslem → důkaz nebo srovnání → jedna rada. Žádné druhé téma |
| Časování | `"timing": { "lead": 0.15, "max_pause": 0.35, "gap_line": 0.32, "gap_act": 0.62, "tail": 0.90 }` (opiš přesně, hlídá to test) |
| Začátek | `lead 0.15`: hlas i první text naskočí hned, žádné ticho na úvod |
| Konec | `tail 0.90`: po poslední větě zůstane obraz necelou sekundu. Delší konec, kde se nic neděje, autor nechce |
| Pauzy | `"max_pause": 0.35` v `timing`: pauzy uvnitř věty delší než 0,35 s se zkrátí (hlas jinak u „?“ a „!“ dělá nepřirozeně dlouhé ticho). Hlas se negeneruje znovu |
| Hlas | živější: `stability 0.26 · similarity 0.8 · style 0.65 · speed 1.1`. Krátké věty, otázky a vykřičníky (hlas podle nich mění melodii) |
| Hook | nejvýš 16 slov, `"captions": false`, velký text ve scéně, hlavní slovo fialově |

**Typy hooků, které drží diváka (každé video jiný, ať se neopakují):**

| Typ | Vzor | Příklad |
|---|---|---|
| otázka, kterou divák zná z vlastní zkušenosti | „Why does … feel …?“ | `why-40-feels-brutal` |
| rozpor s tím, co si lidé myslí | „Stop …! Look at this first.“ | `lighter-bike-myth` |
| mezera ve zvědavosti | „… isn't X. It's Y.“ | `drag-is-behind-you` |
| záhada se srovnáním | „Two …. Same …. One … Why?“ | `same-power-3-minutes` |
| skrytá chyba + slib počtu kroků | „You're wasting … Here are three free fixes.“ | `three-free-fixes` |
| série se stejným začátkem „What if …?“ | „What if + tvrzení proti intuici nebo malá věc s konkrétním číslem?“ | `what-if-headwind`, `what-if-draft`, `what-if-hand-patch`, `what-if-lower-is-slower`, `what-if-weaker-rider-wins` |

Hook nesmí slibovat víc, než video hned potom vysvětlí. Odpověď přijde do 5 s, ne až na konci.

**Série „What if“:** každé video začíná slovy „What if“ (odkaz na slovní hříčku v názvu aplikace). Ve scéně je kreslí
pomůcka `whatIf(t, kdy, y)` ze vzorů `what-if-*`: bílé „what“ a fialové „IF“ písmem Unbounded 800, tedy ve stylu loga.
Samotný název aplikace ani logo ve videu dál nejsou. Čísla s protivětrem se počítají stejným modelem jako `physics.py`,
jen odpor vzduchu je `0,5 · ρ · CdA · (rychlost + vítr)²` (výpočet je v komentáři `what-if-headwind/scenes.js`).

**Víc videí najednou:** `build.sh` umí v jedné složce jen jedno video. Pro každé další udělej pracovní kopii
`work/kits/<title>/` (zkopíruj `build.sh`, `engine`, `tools`, `sim`; do její složky `work/` dej odkazy na
`env`, `fonts`, `sim`, `rider-art.svg.txt`, `icon-512.png` a model v `asr/`) a spouštěj ji s vlastním portem:
`KIT_PORT=8141 bash video-kit/work/kits/<title>/build.sh preview`. Rendery pouštěj po jednom.

## 12. Série z bloků (`series/`): hodně videí najednou

Když má vzniknout víc krátkých videí ve stejném stylu (série „What if“ má 30 dílů), nepíše se `scenes.js` ručně.
Každé video je jeden **popis** ve složce `series/<série>/` a scény se poskládají z hotových bloků.

```
video-kit/series/
  blocks.js     hotové scény (hook, text, bars, rows, race, rider, flow, curve) a nadpisy
  physics.js    výpočty čísel: výkon, rychlost, čas, vítr, sklon, teplota, výška, tlak, vlhkost, dojezd
  make.js       z popisu vyrobí script.json a scenes.js
  run.sh        jedno video: připraví pracovní kopii sady a spustí krok (voice, preview, render, all, dry)
  batch.sh      víc videí za sebou
  asrdiff.py    porovná přepis hlasu s textem a vypíše jen rozdíly
  dry.js        zkušební časová osa bez hlasu (náhled scén, když dojde kvóta hlasu)
  what-if/      30 popisů videí série „What if“
```

**Postup:**
1. Příprava jako vždy: `bash video-kit/build.sh setup && bash video-kit/build.sh sims`.
2. Napiš popis (opiš některý z `series/what-if/`). Obsahuje `title`, `about` (česky, o čem video je), `acts`, `lines`
   (stejné jako ve `script.json`), `scenes` (typ scény a nadpisy pro každý akt), `facts` a `sources`.
3. `node video-kit/series/make.js --facts <popis.js>`: ověří, že čísla ve videu sedí s výpočtem.
4. `bash video-kit/series/batch.sh voice <popisy…>`, potom `python3 video-kit/series/asrdiff.py <název videa…>`.
   Rozdíly jako aero → ARROW jsou jen stejně znějící slova: doplň kotvu titulku (oddíl 8).
5. `bash video-kit/series/batch.sh preview <popisy…>` a prohlédni každý arch
   `work/kits/<název>/work/stills/sheet-1.jpg` podle oddílu 6.
6. `bash video-kit/series/batch.sh render <popisy…>`. Videa jsou ve `work/out/`.

**Pravidla popisu:**
- Časy se nepíšou číslem, ale odkazem na titulek: `'veta:2'` (začátek 3. titulku věty), `'veta'` (začátek věty),
  `'veta$'` (konec věty), volitelně s posunem `'veta:2+0.3'`.
- `facts`: každé číslo, které ve videu zazní nebo je vidět, má řádek `[popis, výpočet, číslo ve videu, tolerance]`.
  Když nesedí, `make.js` video nevyrobí a `npm test` selže. Čísla z literatury patří do `sources`.
- Nadpisy (`heads`) se střídají samy: předchozí zmizí těsně před dalším. Velký text má rezervu do šířky kvůli překmitu.
- Vlastní kresba, kterou bloky neumí, jde přidat funkcí `draw(t, a, dy)` v popisu aktu (viz `12-one-percent`, `29-bigger-has-less-drag`).
- Hlas hlídej: jedno video je asi 430 znaků. **Před větší dávkou si spočítej znaky a ověř, že na ně stačí kvóta ElevenLabs.**
  Když kvóta dojde (chyba `quota_exceeded`), udělej zatím náhledy bez hlasu: `bash video-kit/series/batch.sh dry <popisy…>`.
  Z takového náhledu video vyrenderovat nejde, po obnovení kvóty spusť `voice` a pokračuj.

## 13. Styl: GSAP a efekty z Kokonut UI (zkouška 17. 11. 2026)

Video ze série může mít v popisu `style`, který změní pohyb a efekty, ne obsah ani hlas. Vzory: `series/styl-test/` (šest variant videa what-if-no-air; autorovi se zatím nejvíc líbí styl 1).

| Klíč | Hodnota | Co dělá |
|---|---|---|
| `camera` | `whip` | švih kamery do každého aktu ze strany a pomalé přiblížení během aktu |
| | `drift` | pomalé přiblížení a jemný posun nahoru během aktu |
| | `punch` | krátký „úder“ přiblížení s pružným návratem, když naskočí velké číslo nebo slovo |
| `text` | `words` | velké texty a nadpisy naskakují po slovech s mírným natočením |
| | `flap` | velká čísla a slova jako letištní tabule (Kokonut UI Split Flap Text) |
| | `glitch` | velké texty a nadpisy naskočí s krátkou poruchou signálu (Kokonut UI Glitch Text) |
| `sub` | `typing` | podnadpisy se píšou po písmenech s fialovým kurzorem |
| `bg` | `dots` | vlnící se tečkové pole místo proudu vzduchu (Kokonut UI Dot Field) |
| | `halftone` | polotónové kruhy v pohybu |
| | `paths` | plující vlnovky (Kokonut UI Background Paths) |
| `camera` | `flip` | nový akt se otočí jako karta (roztažení z úzkého proužku) a během aktu pomalé přiblížení |
| `text` | `marker` | jako `words`, pod velkým číslem nebo slovem se natáhne fialový pruh (Kokonut UI Marker Text) |
| | `slot` | číslice velkých čísel se protočí jako válečky automatu (Kokonut UI Dynamic Text), nadpisy jako `words` |
| | `reveal` | slova vyjedou zdola zpoza neviditelné hrany |
| `overlay` | `wipe` | fialový pruh přes celý obraz přejede mezi akty a zakryje střih |
| `hook` | `watt` | úvodní nápis „wattIF“ místo „whatIF“ (hlas beze změny) |

- **GSAP** (`engine/vendor/gsap.min.js`, licence „Standard No Charge“, zdarma i komerčně) dělá kameru a náběhy. Časové osy jsou pozastavené a pro každý snímek se posunou na čas t, takže render po částech dá vždy stejný obraz.
- **Kokonut UI** (MIT) je knihovna pro React. Efekty jsou přepsané do našeho kreslení na plátno, React se nepoužívá. Barvy zůstávají naše tři.
- **Motor** má tři nepovinné háčky: `CAMERA(t)` vrací `{x, y, s, r, sx, sy}` a hýbe scénou (titulky stojí), `BACKGROUND(t, síla)` kreslí pozadí místo proudu vzduchu, `OVERLAY(t)` kreslí přes celý obraz (přechody). Videa bez stylu se nemění.
- **Pozor na okraje:** kamera zvětšuje scénu, text u okraje (řádky s pruhem, x 110 až 970) snese přiblížení nejvýš asi 1,5 %. `preview` a `render` hlásí `PŘETÉKÁ MIMO OBRAZ`.
- **Hlas pro varianty se nekupuje znovu:** do `work/kits/<nový název>/work/tts/` zkopíruj hlas původního videa, krok `voice` ho převezme („beze změny“, 0 znaků).

## 14. Formát „ride“: 3D časovkáři jako ve vzorových reels (stav 21. 11. 2026)

Podle dvou vzorových reels (animovaní jezdci na silnici, fialové proudnice, štítky s čísly, titulky nahoře se zvýrazněným slovem, na konci výzva ke sdílení). Vzory: `series/ride/01-same-power.js` (stejný výkon, základní řídítko vs. aero nástavce), `02-descent.js` (sjezd bez šlapání), `03-headwind.js` (tam proti větru, zpět po větru).

- **Člověk:** model z MakeHuman (data CC0, `engine/models/`, viz README tam): realistické tělo muže s obličejem, rukama a prsty, kostra 163 kostí. `tools/makehuman-cyclist.py` z něj vyrobí `cyclist.json` + `cyclist.bin` (0,6 MB). V `engine/rider3d.mjs` se kostra nastaví do polohy na kole: pánev a záda podle sklonu trupu, nohy dvoukloubovou úlohou na pedály (šlapání), paže v poloze 0 na základní řídítko (dlaně dovnitř k nástavcům, roh řídítka vede skrz pěst; normála dlaně se počítá z kostí prstů, odhad podle osy x dával vykroucená zápěstí; autor 21. 11. 2026: „drží řídítka dlaněmi směrem k aerobarům dovnitř“), od polohy 1 lokty pod rameny, předloktí mírně nahoru po nástavcích a sevřené pěsti u sebe kolem ohnutých konců nástavců (dlaně k sobě, palec přes prsty). Hlava je v časovkářské poloze nízko u rukou: krk skoro v linii zad, hlava skloněná, helma leží ocasem na zádech (autor 21. 11. 2026: „sklop mu hlavu blíž k rukám“). Oblečení (kombinéza, kraťasy, ramena, ponožky) je barva bodů podle vah kostí, s hladkým přechodem.
- **Kolo:** časovkářské (diskové zadní, vysoký ráfek vpředu, aero nástavce s loketními opěrkami, základní řídítko). Opěrky, nástavce a řídítko se přizpůsobí rukám a loktům jezdce (`fit`).
- **Helma:** podle Rudy Project The Wing z fotky od autora (21. 11. 2026), bez loga: hladká bublina s nejvyšším bodem vpředu, krátká zakulacená špička vzadu dole, tmavý lem dole, bílý dvojitý pruh přes temeno, přední štěrbina, fialové zrcadlové hledí se schůdkem v horní hraně. Tvar je vzdálenostní pole převedené marching cubes (počítá se jednou), hledí je tenká skořepina těsně na helmě. Dřívější pokusy (kapka s dlouhým ocasem, Wing57 s ploutví) autor zamítl („helma je příšerná“).
- **Polohy:** 0 = vzpřímeně na základním řídítku, 1 = v aero nástavcích, 2 = nejnižší (sjezd, hlava dole). Dresy `white`, `purple` (zvolený: fialová kombinéza, modrá helma), `black`; přepis barev `over: { helmet: '#E4E3DE' }` (bílá helma s modrým pruhem pro druhého jezdce).
- **Jeden jezdec** (autor 21. 11. 2026: „nech ve videích jen jednoho jezdce“): srovnání ukazuje týž jezdec změnou polohy (vzpřímeně → nástavce, ve sjezdu → nejnižší), kamera blíž (`cam: { pos: [300, 560, 1180], look: [0, 150, -60] }`, jeden pruh).
- **Popis videa:** `style: { captions: 'top' }`, všechny akty `{ type: 'free', draw: ride }`. Funkce `ride(t)` si kameru, silnici a jezdce nastaví v objektu `VIEW` **uvnitř funkce** (do `scenes.js` se přenáší jen funkce).
- **Pomocníci (`series/ride.js`):** `scene3d(VIEW, stav, mezi)` vykreslí silnici, pak `mezi()` (proudnice `air3d`), pak jezdce; `stav.a < 1` scénu ztlumí; `stav.slope` nakloní silnici (stupně). `tag3d` dá štítek nad helmu (u pravého okraje ho posune dovnitř obrazu), `statAt` velké číslo dole, `bigNum` stopky, `ctaEnd` konec.
- **Načítání:** `engine/three-boot.mjs` načte model a nastaví `window.RIDE3D_READY`, na který `setup()` v motoru počká.
- **Render:** WebGL bez grafické karty (`--enable-unsafe-swiftshader`). Snímek se dvěma jezdci asi 0,3 až 0,5 s, video 25 s asi 10 až 15 min.
- **Testy:** `tests/ride3d.js` (model se načte, 163 kostí, jezdec se vykreslí, poloha mění výšku helmy, kolo se točí, silnice ve vlastní vrstvě), `tests/video-kit.js` (popisy ride, náš hlas, titulky nahoře, soubory modelu a licence).
- **Na rovinu:** postava je realistický člověk, ale ne filmová kvalita ze vzoru (bez textury kůže, vlasů a záhybů látky). Helma napodobuje tvar z fotky, není to přesná kopie výrobku.
