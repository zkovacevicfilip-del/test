# Bezpečnost / Security

Našli jste v aplikaci wattIF (dříve Aero pozice) bezpečnostní chybu? Napište prosím na **aeroanalysisapp@gmail.com** s předmětem „Bezpečnost“. Chybu prosím nezveřejňujte, dokud nebude opravená, nespouštějte zátěžové testy a nepracujte s cizími daty.

Found a security issue in wattIF (formerly Aero pozice)? Please email **aeroanalysisapp@gmail.com** with the subject "Security". Please do not disclose it publicly before it is fixed, do not run load tests and do not access other people's data.

## Rozsah / Scope

- Webová aplikace na https://zkovacevicfilip-del.github.io/test/ a její zdrojový kód v tomto repozitáři.
- Výzkumná databáze v Supabase. Pravidla jsou v `supabase/schema.sql`.

## Záměr, ne chyba / Intended behaviour

- Klíč Supabase v `share.js` je veřejný (publishable). Smí jen zapisovat do tabulky `submissions` a volat `get_my_data` a `delete_my_data`, které fungují jen se znalostí náhodného ID zařízení.
- GitHub Pages neumí posílat vlastní HTTP hlavičky. Pravidla prohlížeče (Content Security Policy) jsou proto v meta značkách a ochrana proti vložení do cizí stránky ve skriptu `boot.js`.
