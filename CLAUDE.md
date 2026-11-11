## Instalace skillů z GitHubu (pravidlo uživatele)

Než nainstaluješ jakýkoli skill z GitHubu, vždy ho nejdřív prověř nástrojem NVIDIA SkillSpector a počkej na rozhodnutí uživatele:
1. Když `skillspector` chybí: `uv tool install git+https://github.com/NVIDIA/skillspector.git`.
2. Skill jen stáhni do dočasné složky (nic nespouštěj, neinstaluj) a spusť `skillspector scan <složka> --no-llm --format markdown`.
3. Napiš uživateli česky a stručně výsledek: skóre, doporučení, nálezy a u každého, jestli jde o skutečné riziko, nebo planý poplach (podívej se na označené řádky).
4. Instaluj až po výslovném souhlasu uživatele.
