# Pravidla pro Claude

- Stav projektu a rozhodnutí jsou v `README.md`. Čti z něj jen oddíl, který k úkolu potřebuješ.
- README neimportuj přes @, načítalo by se celé v každé session.

## Kontext a pravidla spolupráce

- Autor je začátečník bez zkušeností s programováním, pracuje na **Android tabletu** (bez PC), píše česky.
- Odpovídej česky, stručně (čte se na tabletu), buď kritický a upozorni, když je něco nerealistické.
- Když něco nevíš, doptej se. Na všechno nejasné se zeptej najednou, jednou zprávou a s možnostmi na výběr. Neptej se postupně.
- Kód dodávej celý a testuj ho (Playwright je v prostředí k dispozici).
- Má předplatné Claude Pro. Limity se sdílí mezi chatem a Claude Code a obnovují se po 5 hodinách, proto drž úkoly malé a konkrétní.
- Nikdy nežádat heslo ani přístupový token ke GitHubu.
- Když tě autor ve stejné věci opraví podruhé, navrhni řádek, který do CLAUDE.md přidat.

## Změny vzhledu

- Nejdřív ukaž 3 až 4 očíslované varianty vedle sebe na jednom obrázku a počkej, až autor vybere číslo. Teprve pak uprav kód.

## Hotovo znamená

- Změna je ověřená a uvedeš čím (například test v Playwrightu).
- Na konci krátce napíšeš: co se změnilo, co má autor zkontrolovat na tabletu (nejvýš 3 kroky) a co se ověřit nepodařilo.
- Když se změnil vzhled, přilož snímky na šířce 412 a 1000 px.

## Vydávání

- Hotovou a ověřenou změnu nahraj rovnou na větev `main` v repozitáři `zkovacevicfilip-del/test`. Je to trvalé výslovné svolení autora, neptej se na něj.

## Bezpečnost

- Žádný skript přímo v HTML (`<script>…</script>`) ani atributy jako `onclick=`. Blokuje je CSP, veškerý kód patří do souborů `.js`.
- Tajné klíče (secret / service_role, heslo databáze, klíče k AI) nikdy do kódu ani do chatu.
- Do veřejného repozitáře nikdy skutečné fotky, videa ani soubory `.fit` s GPS.

## Instalace skillů z GitHubu (pravidlo uživatele)

Než nainstaluješ jakýkoli skill z GitHubu, vždy ho nejdřív prověř nástrojem NVIDIA SkillSpector a počkej na rozhodnutí uživatele:
1. Když `skillspector` chybí: `uv tool install git+https://github.com/NVIDIA/skillspector.git`.
2. Skill jen stáhni do dočasné složky (nic nespouštěj, neinstaluj) a spusť `skillspector scan <složka> --no-llm --format markdown`.
3. Napiš uživateli česky a stručně výsledek: skóre, doporučení, nálezy a u každého, jestli jde o skutečné riziko, nebo planý poplach (podívej se na označené řádky).
4. Instaluj až po výslovném souhlasu uživatele.
