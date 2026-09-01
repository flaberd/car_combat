# Physics-Accurate Ramming Combat

## Context

Ramming is the genre-defining mechanic. Rapier was chosen specifically for
collision accuracy and a ready-made vehicle controller (see
[Locked Technology Stack](001-locked-technology-stack.md)). Faking ramming
damage with arbitrary game-logic numbers would defeat that choice and make
ramming feel disconnected from actual vehicle speed and mass.

---

## Decision

Vehicle-to-vehicle collision damage MUST be derived from the physics
simulation, not scripted or faked. The baseline damage model is:

```
damage = relative_velocity × mass × k
```

applied symmetrically — both vehicles in a collision take damage
simultaneously, each computed from that vehicle's own speed and mass at the
moment of impact (never just the "attacker's").

Rapier's raycast vehicle controller is the source of truth for vehicle
motion, suspension, and drift behavior. Gameplay code may tune coefficients
(e.g. `k`, a minimum-impact threshold) but must not bypass the physics
engine's collision/velocity data to compute combat outcomes.

---

## Consequences

- A heavier/faster vehicle deals more damage than it receives when it rams a
  lighter/slower one — favors the rammer, but both sides always take some
  damage. See [Combat System](../features/combat-system.md).
- `k` and all archetype/weapon numeric values are tuned via playtesting, not
  fixed by this decision — see `src/config/tuning.js`.

---

## Alternatives Considered

Scripted/fixed ramming damage (independent of physics state) was rejected —
it would decouple combat feel from the physics engine the project is built
on.

---

## Related Documents

- [Locked Technology Stack](001-locked-technology-stack.md)
- [Combat System](../features/combat-system.md)
