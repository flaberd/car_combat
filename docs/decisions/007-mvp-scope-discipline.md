# MVP Scope Discipline

## Context

Non-goals were chosen deliberately to keep the MVP shippable. Silently
expanding scope (even a little "future-proofing") is how MVPs stop being
minimal.

---

## Decision

The MVP is single-player against bots, in a single arena-elimination match
format (last-vehicle-standing, no respawns). A feature MUST NOT expand into
any item listed under Non-Goals below without amending this decision first.
When a feature's natural design would touch a non-goal (e.g., a networking
hook for future multiplayer), it MUST scope that out explicitly rather than
partially building it "for later."

**MVP scope**: single-player vs. bots, one arena, elimination format, core
drive/drift/turbo/ram/shoot loop, grey-box visuals.

**Non-goals** (MUST NOT be built without amending this decision):

- Online multiplayer
- Local split-screen multiplayer
- TypeScript (see [Locked Technology Stack](001-locked-technology-stack.md))
- Sound/music
- Final art style/setting
- Physical destruction of environment objects (destructible objects use
  simple 2–3 state HP-threshold visual swaps instead — no fracturing or
  physics debris)
- Gamepad support
- Native app packaging via Capacitor (in-browser touch play is in scope;
  packaging as a native app is a distinct, deferred future direction)
- Randomized pickup spawn locations (fixed, designer-placed only)
- Kill-streak / damage-combo systems
- Weapon upgrades or progression between matches
- Full bot AI (pathfinding, difficulty tuning, tactical behavior) — the
  current opponent uses minimal placeholder behavior only, see
  `docs/todo/knowledge-gaps.md`

---

## Consequences

- Match/game-state code MAY be written in a way that doesn't actively
  preclude multiplayer later, but no multiplayer-specific work (netcode,
  split-screen viewport/input handling) happens pre-MVP.
- Any PR/feature touching a non-goal item needs this document amended first,
  not a silent exception.

---

## Alternatives Considered

Not recorded — non-goals were set at project start to protect MVP scope.

---

## Related Documents

- [Core Loop Lock](006-core-loop-lock.md)
- [Combat System](../features/combat-system.md)
- [Knowledge Gaps](../todo/knowledge-gaps.md)
