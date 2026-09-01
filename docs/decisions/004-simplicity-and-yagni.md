# Simplicity & YAGNI (Vanilla JS First)

## Context

The project starts intentionally minimal to move fast and keep the stack
approachable for a small game built with AI-assisted development.
Complexity must be earned by real requirements, not anticipated ones.

---

## Decision

Code MUST be plain JavaScript (ES modules) with no TypeScript, no framework
(React/Vue/etc.), and no build-time abstraction beyond what Vite provides
out of the box. New dependencies beyond Three.js, Rapier, and Vite tooling
MUST be justified against a concrete, current need — not a hypothetical
future one.

Prefer direct, readable code over premature abstraction layers (e.g., no
generic "entity component system" until the game actually needs one).

---

## Consequences

- Adding a new npm dependency requires asking first (see root `AGENTS.md`).
- No ECS, no state-management library, no UI framework — `src/ui/hud.js`
  and friends manipulate the DOM/canvas directly.

---

## Alternatives Considered

An entity-component-system architecture was considered and deliberately
deferred — the current entity count (a handful of vehicles, projectiles,
pickups) does not justify the abstraction cost.

---

## Related Documents

- [Locked Technology Stack](001-locked-technology-stack.md)
- [Module Overview](../architecture/module-overview.md)
