# Core Loop Lock (Ram/Shoot Parity, Lock-Core-Loop-First)

## Context

This is a physics-and-combat-feel game — if the core loop isn't fun and
balanced, no amount of art or content fixes that. Sequencing protects
against sinking effort into presentation before the mechanics that define
the genre are proven.

---

## Decision

Ramming and shooting are co-equal core combat mechanics — neither may be
implemented, tuned, or shipped in a way that makes the other irrelevant.
Drift and turbo-boost are core control mechanics, not optional flourishes,
and MUST be present from the first driveable prototype.

Work follows a "lock core loop first" sequencing: the core
drive/drift/turbo/ram/shoot loop MUST be functional and stable before any
effort goes into art style, setting, audio, or cosmetic polish. Features
that only affect presentation MUST be sequenced after the loop is locked,
unless required as grey-box placeholders to make the loop testable.

---

## Consequences

- [Core Vehicle Loop](../features/core-vehicle-loop.md) and
  [Combat System](../features/combat-system.md) were built before any art
  pass; the project stays grey-box/art-agnostic until this loop is
  considered locked (see [Visual Approach](#) — not yet a standalone
  document, see `docs/todo/missing-docs.md`).
- A feature that only changes visuals/audio is lower priority than one that
  touches drive/drift/turbo/ram/shoot.

---

## Alternatives Considered

Treating ramming as a secondary mechanic to shooting (or vice versa) was
rejected — the genre's identity depends on both being equally viable combat
choices.

---

## Related Documents

- [Core Vehicle Loop](../features/core-vehicle-loop.md)
- [Combat System](../features/combat-system.md)
- [MVP Scope Discipline](007-mvp-scope-discipline.md)
