# Knowledge Gaps

Known uncertainties surfaced during the migration from the Spec Kit
workflow (`.specify/`, `specs/`) to this `docs/` system. Resolve and remove
an entry once its documentation is confirmed accurate.

---

## Bot opponent (`SeekBot`) is explicitly a placeholder

`src/combat/seekBot.js` implements the current single opponent: steer
toward the player + constant throttle + conditional fire, no pathfinding or
difficulty levels. The former `002-combat-system` spec's Assumptions
section was explicit that this is a minimal placeholder and that "a fully
featured bot AI... is expected to be defined in a later feature." No such
feature has been scoped yet. [Combat System](../features/combat-system.md)
documents this as current behavior; a dedicated bot-AI feature/decision
should be written when that work starts.

---

## Match-level win/loss flow is undocumented because it doesn't exist yet

Elimination (`Vehicle.eliminated = true` at 0 HP) is implemented, but
nothing consumes it into a match outcome (round end, restart, win screen).
The former specs explicitly scoped this out as "a future match-flow
feature." Treat any match-flow behavior as undocumented/unimplemented until
a feature doc is written.

---

## Migrated specs vs. actual implementation were not diffed line-by-line

`docs/features/*.md` were written from the migrated spec content
(`specs/*/spec.md`, `data-model.md`) cross-checked against
`src/config/tuning.js` for concrete numeric values, but not against a full
read of every combat/input source file. If a design rule in
`docs/features/` looks wrong against actual behavior, trust the code (per
`docs/AI_CONTEXT.md`) and correct the doc.

---

## Related Documents

- [Combat System](../features/combat-system.md)
- [MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md)
- [Missing Documentation](missing-docs.md)
