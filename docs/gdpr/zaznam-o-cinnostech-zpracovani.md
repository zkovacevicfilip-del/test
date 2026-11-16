# Záznam o činnostech zpracování (čl. 30 odst. 1 GDPR)

Interní dokument správce. Nemusí se zveřejňovat, ale na vyžádání ho musíš předložit Úřadu pro ochranu osobních údajů (čl. 30 odst. 4 GDPR). Aktualizuj ho při každé změně toho, jaká data aplikace sbírá.

- **Správce:** Filip Kovačević, fyzická osoba, provozovatel aplikace wattIF (dříve Aero pozice)
- **Kontakt:** aeroanalysisapp@gmail.com
- **Pověřenec pro ochranu osobních údajů:** nejmenován (není povinný podle čl. 37 GDPR: správce není orgán veřejné moci a jeho hlavní činností není rozsáhlé zpracování zvláštních kategorií údajů ani rozsáhlé systematické monitorování)
- **Zástupce v EU:** nevyžaduje se (správce je usazen v EU)
- **Datum vytvoření:** 8. 11. 2026, poslední revize: 8. 11. 2026

Proč záznam vedu, i když nemám zaměstnance: výjimka pro organizace do 250 zaměstnanců (čl. 30 odst. 5) neplatí, protože zpracování není příležitostné a zahrnuje údaje, které se mohou týkat zdraví (čl. 9).

---

## Činnost 1: Výzkumná databáze (dobrovolné sdílení dat z aplikace)

| | |
|---|---|
| **Účel** | Statistický výzkum vztahu mezi pozicí na kole, mobilitou, výkonem a aerodynamikou; zlepšování aplikace (např. přesnější odhady CdA). Zveřejňují se jen souhrnné anonymní výsledky. |
| **Právní základ** | Souhlas (čl. 6 odst. 1 písm. a) GDPR); u údajů, které se mohou týkat zdraví, výslovný souhlas (čl. 9 odst. 2 písm. a) GDPR). Souhlas mohou udělit jen osoby starší 15 let (§ 7 zákona č. 110/2019 Sb.). |
| **Kategorie subjektů údajů** | Uživatelé aplikace starší 15 let, kteří udělili souhlas a data odeslali. |
| **Kategorie osobních údajů** | Pseudonymní náhodné ID zařízení; úhly těla (z boku, zepředu, zezadu); tělesné míry (výška, hmotnost, obvod pasu, délka nohy), pokud je uživatel vyplní; výsledky testů mobility; jízdní a aerodynamická data (CdA, valivý odpor, rychlost, výkon, podmínky měření, vítr); test výkonu (výkon, **tepová frekvence**, kadence, pohodlí); čelní plocha; propojené záznamy pozic s datem uložení a náhodným ID záznamu; verze a čas souhlasu; čas přijetí záznamu. |
| **Zvláštní kategorie (čl. 9)** | Ano, mohou se vyskytnout údaje o zdraví (mobilita, tělesné míry, tepová frekvence). Zpracovávají se jen na základě výslovného souhlasu. |
| **Co se nesbírá** | Fotky, videa, jména, e-maily, poznámky uživatele, popisy a názvy pozic a variant, poloha GPS, soubory .fit, IP adresy (databáze je neukládá). Volný text databáze technicky odmítne. |
| **Zdroj údajů** | Přímo uživatel (odeslání z aplikace po udělení souhlasu). |
| **Příjemci / zpracovatelé** | Supabase Pte. Ltd. (Singapur), zpracovatel podle čl. 28 GDPR na základě Data Processing Addendum verze 1 z 1. 8. 2026, které je součástí podmínek služby Supabase (platí přijetím podmínek, podpis se nevyžaduje). Subdodavatelé podle seznamu na supabase.com/legal/customer-resources/subprocessor-list. Jiným příjemcům se údaje neposkytují. |
| **Předávání do třetích zemí** | Data jsou uložena v EU (AWS Frankfurt, eu-central-1; DPA bod 6.1: data se ukládají a primárně zpracovávají ve zvoleném regionu). Zpracovatel sídlí v Singapuru (bez rozhodnutí o odpovídající ochraně), předání je proto zajištěno standardními smluvními doložkami (rozhodnutí Komise (EU) 2021/914), které jsou součástí DPA (bod 12; přijetí podmínek = podpis doložek, bod 12.2). |
| **Lhůta pro výmaz** | Po dobu trvání výzkumu, nejdéle 5 let od odeslání. Dříve na žádost nebo samoobslužně (funkce `delete_my_data`). Kontrola jednou ročně (viz postup pro správce). |
| **Technická a organizační opatření (čl. 32)** | Šifrované spojení HTTPS; Row Level Security: veřejný klíč smí jen zapisovat (nečte, nemaže, nemění); kontroly typu a velikosti dat v databázi; databáze přijme jen čísla, ano/ne a krátké hodnoty (volný text, HTML, odkazy ani e-maily odmítne); řádek bez záznamu o souhlasu odmítne; limity 50 odeslání za den z jednoho zařízení, 600 za hodinu a 5000 za den celkem, strop velikosti tabulky 300 MB; v aplikaci pravidla pro prohlížeč (Content Security Policy), ochrana proti vložení do cizí stránky, kontrola otisku modelu od Googlu a očištění načítaných záloh; pseudonymizace (náhodné ID zařízení, které vzniká až se souhlasem); minimalizace dat (jen čísla, žádné volné texty); přístup ke čtení a správě jen přes účet správce v Supabase, chráněný dvoufázovým ověřením (zapnout podle postupu pro správce, bod 1); data v regionu EU; záznam o souhlasu (verze, čas) u každého řádku. |

## Činnost 2: Komunikace a vyřizování žádostí e-mailem

| | |
|---|---|
| **Účel** | Odpovědi na dotazy uživatelů a vyřizování žádostí o uplatnění práv podle GDPR. |
| **Právní základ** | Oprávněný zájem na komunikaci (čl. 6 odst. 1 písm. f) GDPR); u žádostí podle GDPR plnění právní povinnosti (čl. 6 odst. 1 písm. c) a čl. 12 GDPR). |
| **Kategorie subjektů údajů** | Osoby, které správci napíšou. |
| **Kategorie osobních údajů** | E-mailová adresa, jméno (pokud ho pisatel uvede), obsah zprávy, případně anonymní ID zařízení. |
| **Příjemci / zpracovatelé** | Google (služba Gmail, účet aeroanalysisapp@gmail.com). |
| **Předávání do třetích zemí** | Podle podmínek služby Gmail (Google LLC, USA). |
| **Lhůta pro výmaz** | Po dobu vyřízení, poté nejdéle 3 roky (promlčecí lhůta) pro případ sporu. |
| **Opatření** | Dvoufázové ověření účtu Gmail, schránka používaná jen pro aplikaci. |

## Činnosti, při kterých správce osobní údaje nezpracovává (pro úplnost)

- **Data v zařízení uživatele** (fotky, videa, výsledky, Moje pozice, nastavení): zpracovávají se jen v prohlížeči uživatele, správce k nim nemá přístup.
- **Hosting GitHub Pages:** GitHub, Inc. zpracovává IP adresy návštěvníků pro zabezpečení služby jako samostatný správce. Správce aplikace k těmto záznamům nemá přístup. Uvedeno v zásadách (oddíl 3).
- **Model DeepLab od Googlu:** při použití funkce obrysu stahuje prohlížeč model ze serveru Google, Google získá IP adresu jako samostatný správce. Uvedeno v zásadách (oddíl 4).

---

## Posouzení rizik a nutnosti posouzení vlivu (DPIA, čl. 35 GDPR)

Kritéria podle pokynů WP248 rev.01 (převzaty EDPB) a seznamu ÚOOÚ:

| Kritérium | Splněno? | Poznámka |
|---|---|---|
| Hodnocení nebo scoring, profilování | Ne | Výpočty probíhají v zařízení uživatele, správce neprofiluje. |
| Automatizované rozhodování s právním účinkem | Ne | |
| Systematické monitorování | Ne | |
| Citlivé údaje (čl. 9) | **Ano** | Možné údaje o zdraví. |
| Rozsáhlé zpracování | Ne | Hobby projekt, desítky až stovky uživatelů, malý objem dat na osobu. |
| Kombinace datových sad | Ne | |
| Zranitelné osoby | Částečně | Uživatelé od 15 let; žádní zaměstnanci, pacienti ani děti pod 15 let. |
| Inovativní technologie | Ne | Běžná databáze; strojové učení běží jen v zařízení uživatele a do databáze nevstupuje. |
| Zpracování brání výkonu práv | Ne | Práva lze uplatnit samoobslužně i e-mailem. |

**Závěr:** splněno jedno kritérium (částečně druhé). Zpracování nevyžaduje DPIA. Riziko je nízké díky dobrovolnosti, pseudonymizaci, minimalizaci dat, uložení v EU a databázi jen pro zápis. **Posouzení zopakuj**, pokud uživatelů bude výrazně víc (řádově tisíce), začneš sbírat další typy údajů (např. fotky, polohu, volný text), propojovat data s jinými zdroji nebo je předávat dalším subjektům.

## Hlavní rizika a jejich ošetření

| Riziko | Ošetření |
|---|---|
| Únik databáze | RLS (veřejný klíč nečte), pseudonymizace, žádné přímé identifikátory, 2FA na účtu Supabase, data v EU. |
| Zneužití účtu správce | 2FA na Supabase, GitHub a Gmail; silná unikátní hesla; secret klíč nikdy v kódu ani v chatu. |
| Re-identifikace z kombinace údajů | Žádná jména ani GPS; zveřejňovat jen souhrny za skupiny alespoň 10 osob. |
| Odeslání dat bez platného souhlasu | Odeslání je technicky možné jen se zaškrtnutým souhlasem aktuální verze; verze a čas souhlasu jsou u každého záznamu. |
| Smazání cizích dat | Funkce mazání vyžaduje náhodné ID zařízení (122 bitů náhody), které zná jen uživatel. |
| Zneužití veřejného zápisu (spam, cizí obsah, zaplnění databáze) | Databáze přijme jen čísla a krátké hodnoty, limity na zařízení, hodinu a den, strop velikosti tabulky pod limitem bezplatného tarifu. |
| Podvržený kód nebo model v aplikaci (XSS, dodavatelský řetězec) | Content Security Policy, knihovny hostované s aplikací, kontrola otisku SHA-256 u modelu od Googlu, ošetřený výpis a očištění načítaných záloh. Pravidelně ověřováno automatickými testy a bezpečnostním testem Strix. |
