# Core Vehicle Loop

## Purpose

The foundational drive/steer/drift/turbo loop — a single player drives a
vehicle around a grey-box arena in third-person view, using
physically-accurate motion. Per [Core Loop Lock](../decisions/006-core-loop-lock.md),
this loop had to be functional and stable before any combat or presentation
work.

---

## Scope

Driving, steering, drift, turbo-boost, camera follow, and arena boundaries.
Combat (weapons, ramming damage, archetypes) is covered by
[Combat System](combat-system.md). Touch input is covered by
[Mobile Touch Controls](mobile-touch-controls.md).

---

## Player Experience

- Third-person camera follows the vehicle (`src/camera/followCamera.js`).
- Forward/reverse acceleration and steering are driven entirely by Rapier's
  raycast vehicle controller — no scripted transform changes (see
  [Physics-Accurate Ramming Combat](../decisions/002-physics-accurate-ramming.md),
  which extends the same "physics is truth" rule to combat).
- Holding drift shifts the vehicle into a lower-lateral-traction handling
  state (sliding); releasing it restores normal handling.
- Turbo is a rechargeable boost meter, held down to use: while held (and
  charge remains) it boosts speed/acceleration; releasing it stops the
  boost immediately and the meter starts recharging right away — no fixed
  duration or separate cooldown to wait out. A HUD bar (`src/ui/hud.js`)
  shows the charge level: full while ready, draining while boosting,
  refilling with a countdown to full while released and not yet full.
- The arena is a grey-box ground plane with boundary geometry that
  physically contains the vehicle (no passing through walls).

---

## Design Rules

Values below are the current tuning in `src/config/tuning.js` (tunable via
playtesting, not fixed by this document):

- **Drift**: only takes effect above `DRIFT.minSpeedForEffect` (4 m/s) — no
  meaningful slide at near-zero speed. Side friction drops from
  `normalSideFriction` (3.0) to `driftSideFriction` (0.35) while active.
- **Turbo**: per-archetype `turboBoostMultiplier`, `turboBoostDuration`, and
  `turboCooldown` (see [Combat System](combat-system.md) for the three
  archetypes' values) — turbo is live/held (matches Drift), and those two
  duration values now read as rates for a rechargeable meter: charge drains
  at `1 / turboBoostDuration` per second while held and boosting, and
  refills at `1 / turboCooldown` per second only while the button is
  released (holding through an empty meter neither drains further nor
  recharges — recharging strictly requires letting go, which also avoids a
  drain/recharge flicker right at empty). Any amount of charge can be spent
  as soon as the button is pressed again — there's no "must fully recharge
  first" gate.
- **Input axes**: `InputState` exposes both `moveAxis` (drive/steer, live)
  and `aimAxis` (reserved, always `{0,0}` — weapons fire in the vehicle's
  facing direction instead, see `src/input/inputState.js`).
- **Camera**: follows with a lerp factor (`CAMERA.followLerp = 4.5`) rather
  than snapping instantly.

---

## Edge Cases and Constraints

- No input → vehicle stays stationary or coasts to a stop under the
  physics simulation's natural friction/deceleration.
- Drift and turbo can be active simultaneously; both effects apply
  concurrently.
- Colliding with the arena boundary physically stops/deflects the vehicle
  (collision response, not a scripted clamp) — this is boundary collision
  only, distinct from vehicle-vehicle ramming damage
  (see [Combat System](combat-system.md)).
- No persistence: vehicle/input state resets on page reload (see
  [Static-Site, No-Backend Architecture](../decisions/003-static-site-no-backend.md)).

---

## Implementation Entry Points

Systems

- `src/vehicle/vehicle.js` — chassis/wheel setup, per-frame control step
- `src/vehicle/drift.js` — traction-state switching
- `src/vehicle/turbo.js` — turbo charge meter (drains while held+boosting, recharges otherwise)
- `src/ui/hud.js` — turbo readiness bar/text (also owns HP/weapon HUD, see [Combat System](combat-system.md))
- `src/physics/world.js` — Rapier world setup/step
- `src/arena/arena.js` — ground + boundary colliders
- `src/camera/followCamera.js` — third-person follow camera
- `src/input/inputController.js`, `src/input/inputState.js` — keyboard → `InputState` mapping

Config

- `src/config/tuning.js` (`DRIFT`, `CAMERA`, `VEHICLE_SHAPE`, per-archetype
  turbo values in `ARCHETYPES`)

Tests

- `tests/unit/vehicle.test.js`, `tests/unit/turbo.test.js`,
  `tests/unit/inputController.test.js`, `tests/unit/inputState.test.js`

---

## Related Documents

- [Locked Technology Stack](../decisions/001-locked-technology-stack.md)
- [Physics-Accurate Ramming Combat](../decisions/002-physics-accurate-ramming.md)
- [Core Loop Lock](../decisions/006-core-loop-lock.md)
- [Combat System](combat-system.md)
- [Mobile Touch Controls](mobile-touch-controls.md)
