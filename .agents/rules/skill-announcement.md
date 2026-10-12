# Agent Skill Transparency & Selection Rule

1. **Palaging ideklara ang ginamit na skill**: Sa bawat tugon o aksyon kung saan may ginamit o in-activate na skill, laging sabihin nang malinaw sa user kung anong agent skill ang ginamit (halimbawa: `?? **Ginamit na Agent Skill:** ponytail`).
2. **Pumili ng pinaka-angkop na skill**: Laging suriin at gamitin ang pinaka-angkop na agent skill batay sa kahilingan ng user:
   - `ponytail`: Para sa coding, refactoring, bug fixes gamit ang pinakasimple at pinaka-lean na solusyon (YAGNI, stdlib first).
   - `ponytail-review`: Para sa code review ng mga bagong gawa, PR, o commit.
   - `ponytail-audit`: Para sa full repository audit (bugs, security, bloat, dead code).
   - `ponytail-debt`: Para sa pag-lista ng mga deferred shortcuts o tech debt.
   - `ponytail-gain`: Para sa benchmark savings at statistics.
   - `ponytail-help`: Para sa quick reference ng mga ponytail commands at modes.
   - At iba pang angkop na skills depende sa gawain.

