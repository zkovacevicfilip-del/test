# Postup pro správce osobních údajů (Filip)

Praktický návod, co dělat, aby provoz aplikace odpovídal GDPR. Doplňuje záznam o činnostech zpracování.

## 1. Udělej hned (jednorázově)

- [x] **Spusť znovu celý SQL** ze souboru `supabase/schema.sql` v Supabase (SQL Editor → New query → vložit celý soubor → Run). Dole se musí ukázat „Ochrana je zapnutá“; samotné „Success. No rows returned“ znamená, že se nevložil celý soubor. Hotovo 8. 11. 2026, ověřeno na živé databázi (volný text a zápis bez souhlasu odmítne, data z aplikace přijme). Od 8. 11. 2026 přibyly dvě části „Zpřísnění zabezpečení“: kontrola obsahu (jen čísla a krátké hodnoty), povinný záznam o souhlasu, limity a strop velikosti. Skript jde spustit opakovaně.
- [x] **Vypni registraci uživatelů v Supabase:** Authentication → Sign In / Providers → vypnout „Allow new users to sign up“. Aplikace přihlašování nepoužívá a otevřená registrace by šla zneužít (cizí účty, rozesílání e-mailů z tvého projektu). Hotovo 8. 11. 2026, ověřeno.
- [x] **Smlouva o zpracování se Supabase (DPA, čl. 28 GDPR):** Data Processing Addendum verze 1 z 1. 8. 2026 je součástí podmínek služby Supabase a platí jejich přijetím. Smluvní strana je Supabase Pte. Ltd. (Singapur), standardní smluvní doložky jsou součástí (bod 12, přijetí = podpis). Podpis není nutný. Podepsanou kopii si můžeš volitelně vyžádat v dashboardu (Settings → Legal Documents). Kopii textu si ulož k sobě.
- [ ] **Přihlas se k odběru změn subdodavatelů** na supabase.com/legal/customer-resources/subprocessor-list. Jen tak ti Supabase dá 30 dní předem vědět o nových subdodavatelích (DPA bod 6.3). Na námitku máš pak 5 dní.
- [ ] **Zapni dvoufázové ověření (2FA)** na účtech Supabase a Gmail (aeroanalysisapp@gmail.com). GitHub už ho má.
- [x] **Testovací řádky** z 7. 11. 2026 (ID zařízení `00000000-0000-4000-8000-000000000001`) už v databázi nejsou, ověřeno 8. 11. 2026. Kontrola v SQL Editoru: `select id, created_at, kind from public.submissions where device_id = '00000000-0000-4000-8000-000000000001';` (má vrátit „No rows returned“).
- [x] Zkontroluj, že projekt v Supabase je v regionu **Central EU (Frankfurt)** (je).
- [ ] Volitelně **bezpečnostní test Strix** (postup v README, část Zabezpečení). Pokud testoval i živou databázi, smaž jeho testovací řádky: `delete from public.submissions where device_id = '00000000-0000-4000-8000-0000000000aa';`

## 2. Žádosti uživatelů (lhůta: do 1 měsíce od doručení)

Uživatel tě zná jen přes **anonymní ID zařízení**. Většinu žádostí si vyřídí sám na stránce Zásady ochrany osobních údajů → Tvoje data. Když napíše e-mailem:

**Přístup / kopie dat (čl. 15, 20):**
```sql
select * from public.submissions where device_id = 'ID-UŽIVATELE' order by created_at;
```
Výsledek exportuj (v Table Editoru filtr podle device_id → Export → CSV) a pošli mu ho.

**Smazání (čl. 17) nebo odvolání souhlasu s výmazem:**
```sql
delete from public.submissions where device_id = 'ID-UŽIVATELE';
```

**Oprava (čl. 16):** data jsou čísla z měření, obvykle stačí smazat a uživatel pošle nová.

**Námitka, omezení:** odpověz individuálně, případně data smaž nebo přestaň zpracovávat.

Bez ID zařízení data nenajdeš (to je v pořádku, vysvětli to). Vždy odpověz, i kdyby žádná data nebyla. E-mail se žádostí si nech nejdéle 3 roky.

### Vzor odpovědi
> Dobrý den, děkuji za zprávu. Vaši žádost o [smazání / kopii] dat k anonymnímu ID [ID] jsem vyřídil dne [datum]. [Data jsem smazal. / Data posílám v příloze.] Další informace najdete v Zásadách ochrany osobních údajů aplikace Aero pozice. S pozdravem Filip Kovačević

## 3. Únik dat nebo podezření na něj (čl. 33 a 34)

1. Okamžitě omez škodu (změň hesla, zneplatni klíče v Supabase → Project Settings → API Keys, případně dočasně vypni zápis).
2. Zapiš si, co se stalo, kdy, jaká data a kolik záznamů.
3. Pokud je pravděpodobné riziko pro práva lidí, **ohlas to ÚOOÚ do 72 hodin** od zjištění (formulář na uoou.gov.cz, sekce ohlašování porušení zabezpečení).
4. Při vysokém riziku informuj i dotčené uživatele (např. oznámením v aplikaci, protože kontakty na ně nemáš).
5. Každý incident si zapiš, i když ho neohlašuješ (čl. 33 odst. 5).

## 4. Pravidelně

**Jednou za měsíc:**
- [ ] **Záloha výzkumných dat:** Supabase → Table Editor → `submissions` → Export → CSV. Bezplatný tarif Supabase zálohy ke stažení nenabízí, při chybě nebo smazání projektu by data zmizela. Soubor obsahuje údaje, které se mohou týkat zdraví: ulož ho šifrovaně (např. zaheslovaný archiv) a nikdy ne do GitHubu.
- [ ] **Kontrola zneužití** (SQL Editor). Nečekaný skok v počtu odeslání znamená, že někdo zkouší limity:
```sql
select date_trunc('day', created_at) as den, count(*) as odeslani, count(distinct device_id) as zarizeni
from public.submissions group by 1 order by 1 desc limit 14;
```

**Jednou ročně:**
- [ ] Smaž záznamy starší 5 let:
```sql
delete from public.submissions where created_at < now() - interval '5 years';
```
- [ ] Projdi záznam o činnostech zpracování a zásady, jestli sedí na současnou aplikaci.
- [ ] Zkontroluj, jestli platí rámec EU–USA (Data Privacy Framework) a nezměnila se DPA Supabase.

## 5. Když budeš měnit aplikaci

| Změna | Co upravit |
|---|---|
| Sdílí se nový typ údajů nebo se mění účel | Zásady (oddíl 5), záznam o činnostech, **zvýšit `CONSENT_VER` v `share.js`** (aplikace si vyžádá nový souhlas). |
| Mění se podmínky použití | `podminky.html` (verze, datum), **zvýšit `AERO_TERMS_VER` v `boot.js`** (a `boot.js?v=` v `index.html`) a číslo u `podminky.html?v=` v `terms.js` (aplikace zobrazí nové podmínky k přijetí). |
| Do sdílených dat přibývá nové pole | Smí obsahovat jen čísla, ano/ne nebo krátké hodnoty (do 40 znaků: písmena, číslice a `._:-`), jinak ho databáze odmítne. Ověř odesláním z testovacího zařízení. |
| Přidáváš skript nebo připojení k dalšímu serveru | Skript jen jako soubor `.js` (skript vložený do HTML pravidla CSP zablokují). Nový server přidat do `connect-src` v CSP v `index.html` a zvážit dopad na zásady. |
| Přidáváš službu třetí strany (analytika, fonty, CDN, reklama) | Nejdřív zvaž, jestli je nutná. Pokud ano: zásady, případně souhlas (cookies a podobné technologie vyžadují souhlas podle § 89 odst. 3 zákona č. 127/2005 Sb.). |
| Aplikace začne vydělávat (reklama, platby, předplatné) | Stáváš se podnikatelem: zákon o ochraně spotřebitele, informační povinnosti, živnost, daně, případně digitální obsah podle § 2389a a násl. OZ. **Poraď se s právníkem.** |
| Funkce by měla sloužit k diagnóze nebo léčbě | Hrozí, že se aplikace stane zdravotnickým prostředkem (nařízení (EU) 2017/745). **Nedělat bez právníka.** |

## 6. Zveřejňování výsledků výzkumu

- Zveřejňuj jen souhrny (průměry, rozptyly, grafy) za skupiny alespoň 10 osob.
- Nikdy nezveřejňuj surová data ani ID zařízení.

## 7. Co nechat zkontrolovat právníkem (doporučení)

Dokumenty jsou připravené pečlivě podle platných předpisů, ale nejsou právní služba. Pokud aplikace poroste nebo ji budeš propagovat, je rozumné nechat jednorázově zkontrolovat:
- Podmínky použití (hlavně omezení odpovědnosti a zdravotní upozornění),
- Zásady ochrany osobních údajů,
- zda ti stačí kontakt e-mailem, nebo uvést i poštovní adresu (čl. 13 odst. 1 písm. a) GDPR vyžaduje „kontaktní údaje“; e-mail je kontaktní údaj, adresa se doporučuje).
