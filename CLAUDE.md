## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Instalace skillů z GitHubu (pravidlo uživatele)

Než nainstaluješ jakýkoli skill z GitHubu, vždy ho nejdřív prověř nástrojem NVIDIA SkillSpector a počkej na rozhodnutí uživatele:
1. Když `skillspector` chybí: `uv tool install git+https://github.com/NVIDIA/skillspector.git`.
2. Skill jen stáhni do dočasné složky (nic nespouštěj, neinstaluj) a spusť `skillspector scan <složka> --no-llm --format markdown`.
3. Napiš uživateli česky a stručně výsledek: skóre, doporučení, nálezy a u každého, jestli jde o skutečné riziko, nebo planý poplach (podívej se na označené řádky).
4. Instaluj až po výslovném souhlasu uživatele.
