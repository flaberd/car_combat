# Phase 0 Research: Combat System — Ramming, Weapons, Archetypes, Pickups

## 1. Detecting ramming collisions (Principle II damage formula)

**Decision**: Enable Rapier collision events on every vehicle chassis
collider (`ColliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)`),
pass a reusable `RAPIER.EventQueue(true)` into `world.step(eventQueue)` each
frame, and drain it with `eventQueue.drainCollisionEvents((h1, h2, started) => ...)`.
On `started === true` for a pair of collider handles that both map to
vehicles (via a `colliderHandle -> vehicle` lookup registered at spawn
time), read each vehicle's *own* current speed (`rigidBody.linvel()`
magnitude) and mass at that instant and apply `damage = speed * mass * k`
to **the other** vehicle's HP — symmetrically, once per vehicle in the pair,
per spec's "each proportional to their own speed×mass" rule (not relative
velocity, and not "whoever hit").

**Rationale**: `drainCollisionEvents` fires only on the start of a new
contact, not every physics step while overlapping — this is exactly
"one damage application per collision," with no manual debounce logic
needed. Reading velocity/mass directly from the Rapier rigid bodies at the
moment of contact keeps Principle II's requirement intact: damage is
derived from the physics simulation, never scripted.

**Alternatives considered**: `drainContactForceEvents` (force-threshold
based) — rejected, it reports the Rust engine's constraint-solver contact
force, not a value that maps cleanly onto the spec's explicit
`speed * mass * k` formula; the collision-event + read-velocity-at-impact
approach matches the spec's formula exactly instead of approximating it.

## 2. Sensor colliders for pickups, mines, and oil-slick trails

**Decision**: Model pickup zones, mines, and oil-slick trail segments as
static/fixed Rapier colliders with `.setSensor(true)` and
`.setActiveEvents(COLLISION_EVENTS)`. The same `drainCollisionEvents` drain
from §1 reports sensor-vs-vehicle contact start (and stop, useful for oil
slick's "currently inside" friction effect) via the identical
handle-pair/`started` mechanism — no second event system needed.

**Rationale**: Sensors are Rapier's built-in mechanism for "detect overlap,
no physical collision response," which is exactly pickups/mines/oil need
(a vehicle must pass through them, not bounce off). Reusing one
collision-event pipeline for both hard collisions (ramming) and sensor
overlaps (pickups/mines/oil) keeps the physics-integration code in one
place.

**Alternatives considered**: Manual distance-check polling (compare vehicle
position to each zone's position every frame) — rejected, reinvents what
Rapier's sensors already do, and loses the free "entered vs exited" edge
detection the collision-event `started` boolean gives.

## 3. Machine gun: hitscan raycast

**Decision**: Machine gun fire is a hitscan `world.castRay(ray, maxToi,
true, undefined, undefined, undefined, shooterChassisBody)` cast from the
firing vehicle's nose position along its current forward direction, with
`maxToi` set to the weapon's range and `filterExcludeRigidBody` set to the
shooter's own chassis so it can't hit itself. A hit whose collider maps to
another vehicle applies `damage_per_hit` immediately; fire rate is enforced
by a per-vehicle cooldown timer (`1 / fire_rate` seconds between shots),
mirroring the turbo cooldown pattern already established in
001-core-vehicle-loop's `TurboState`.

**Rationale**: The spec explicitly leaves hitscan-vs-projectile as an
"implementer's choice" (FR-003 acceptance scenario). Hitscan is simpler
(no projectile lifecycle to manage) and fits a fast, low-damage,
high-fire-rate weapon like a machine gun — a visible tracer/muzzle-flash
effect can be purely cosmetic on top of an instant hit, satisfying the
grey-box Visual Approach without needing physics-simulated bullets.

**Alternatives considered**: Small physics-body projectiles for the machine
gun too — rejected as unnecessary complexity/perf cost for a
5-shots-per-second weapon (Principle IV: no dependency/effort ahead of real
need); reserved for the two weapons that actually need travel-time behavior
(rockets, homing rockets — see §4).

## 4. Rockets and homing rockets: kinematic (non-physics-body) projectiles

**Decision**: Rockets and homing rockets are plain JS objects tracking
position/velocity, advanced manually each frame (`position += velocity *
dt`) — not Rapier rigid bodies. Hit detection is a short raycast (or
sphere check) from the projectile's previous to current position each
frame, using the same `world.castRay` mechanism as §3. A straight rocket's
velocity direction is fixed at launch; a homing rocket's velocity direction
is re-steered a limited amount per frame toward its locked target's current
position (a max turn rate, per spec's "dodgeable via sharp direction
change").

**Rationale**: Consistent with §3 — these projectiles don't need Rapier's
rigid-body simulation (no bouncing, no mass-based interaction with other
physics bodies is specified), just movement and hit detection, which a
manual per-frame update plus raycast provides at a fraction of the
complexity of spawning/destroying physics bodies for every shot. This
keeps Principle II's "vehicle motion must be Rapier-driven" scope where it
belongs — vehicles — without over-extending it to every projectile, which
the constitution doesn't require (Principle II is titled and scoped to
"Ramming Combat").

**Alternatives considered**: Full Rapier dynamic-body projectiles —
rejected as unjustified complexity (Principle IV) for objects with no
specified physics-interaction requirements beyond "travels and hits."

## 5. Mines: sensor + timers

**Decision**: A mine is a sensor collider (§2) plus two plain timers:
`armDelay` (inert until elapsed) and `lifetime` (despawns if untriggered).
While armed, any `started` collision event with a vehicle (including the
mine's own placer, per spec's edge case — no placer exemption after arming)
triggers detonation: apply `damage_on_trigger` to that vehicle and remove
the mine.

**Rationale**: Directly matches FR-011; no physics simulation needed beyond
the sensor overlap already covered by §2.

## 6. Oil slick: trail as a sequence of sensor zones with a friction hook

**Decision**: Depositing oil slick spawns several small sensor colliders
laid out in a line behind the vehicle at deployment time, together
covering the spec's 8m trail length, each with a 3s lifetime. While a
vehicle's chassis is in contact with any oil-slick sensor (tracked via
`started`/`stopped` collision events, §2), that vehicle's wheels get the
same kind of temporary side-friction-stiffness reduction 001's `drift.js`
already applies for drifting — reusing `applyTractionState`'s underlying
mechanism (`controller.setWheelSideFrictionStiffness`) with an oil-specific
multiplier and duration, rather than inventing a parallel friction system.

**Rationale**: A "trail" is really just several static patches placed at
once, which composes cleanly with the existing sensor/collision-event
pipeline (§2) and the existing wheel-friction manipulation entry point
(001's drift mechanism) instead of adding a second way to affect wheel
grip.

**Alternatives considered**: A single long capsule/box sensor — rejected,
harder to have the oil trail's shape realistically follow a curving vehicle
path than several straight segments dropped as the vehicle deposits it.

## 7. Vehicle archetypes and configuration

**Decision**: Extract `createVehicle(world, scene, archetypeConfig)` to
accept an archetype config object (mass, hp, max_speed, turn_rate class,
turbo cooldown/boost) instead of reading module-level constants directly;
`src/config/tuning.js`'s existing flat `VEHICLE`/`TURBO` objects become
per-archetype entries (`ARCHETYPES.heavy`, `.light`, `.balanced`) that this
feature's config supersedes for 001's single-profile approach, satisfying
FR-013's single-centrally-editable-location requirement for the combined
001+002 stat set. `max_speed` is enforced as an explicit clamp on the
chassis's forward speed component each control step (engine force alone
doesn't reliably respect a stated top speed under Rapier's simulation, and
the spec gives exact numbers that must hold).

**Rationale**: This is a mechanical extension of 001's existing tuning
approach (research.md §2 there), not a new pattern — one config source,
now with three named profiles instead of one flat set of numbers.

## 8. Archetype selection screen

**Decision**: Add a minimal three-button archetype-selection overlay
(Heavy / Light / Balanced), shown after 003's Start Gate and before the
vehicle spawns, reusing the same overlay/button DOM-and-CSS pattern
`src/ui/touchControls.css` already established for the Start button.

**Rationale**: Spec Acceptance Scenario 1 for User Story 3 explicitly frames
this as "the game offers archetype selection, when a player picks..." — a
selection UI is part of the requirement, not just the underlying stat
differences. Reusing the Start Gate's established overlay pattern (grey-box,
no new visual system) keeps this consistent with Principle IV.

## 9. Weapon fire input: forward-facing, no independent aim reticle

**Decision**: All weapons (machine gun, rockets, homing rockets, mines,
oil slick) fire/deploy relative to the vehicle's current facing direction —
there is no independent aim reticle in this slice. `InputState` gains two
new fields: `fire` (boolean, held — drives the machine gun's fire-rate-
limited hitscan) and `usePickup` (boolean, held — drives the currently
held pickup weapon: instant-use for rockets/mines/oil slick on the rising
edge, hold-to-lock-then-auto-fire for homing rockets). `aimAxis` remains
unbound in this slice too, exactly as it already was after
003-mobile-touch-controls — still reserved for a genuinely independent-aim
feature, if one is ever built. Keyboard binds `fire` to `KeyF` and
`usePickup` to `KeyE`; touch adds two more on-screen buttons ("Fire",
"Use") via the exact `createTouchButton` helper 003 already built for
Drift/Turbo.

**Rationale**: The spec never requires independent aiming (no reticle, no
aim-direction FR) — forward-facing weapon fire matches the vintage
car-combat genre this project is modeled on (per the constitution's
project framing) and is dramatically simpler than adding aim-direction
math and crosshair UI that nothing in the spec asks for (Principle IV).
Reusing `createTouchButton` and the keyboard edge-trigger pattern from
001/003 rather than inventing new input primitives keeps the input layer
consistent (research.md precedent from both prior features).

**Alternatives considered**: Binding fire to the right joystick's push
direction as an aim-and-fire twin-stick control — rejected for this slice;
nothing in the spec calls for independently-aimed weapons, and building
aim-direction handling now would be speculative complexity with no current
requirement driving it (Principle IV). The right joystick and `aimAxis`
stay reserved exactly as before.

## 10. Opponent presence: minimal seek-bot

**Decision**: A single opponent vehicle (Assumptions: minimal placeholder,
not full AI) is created via the same `createVehicle`/`stepVehicleControl`
used for the player, fed a synthesized `InputState` each frame computed by
a small `seekBot.js`: steer toward the player's current position (simple
heading-difference-to-steering-input math), throttle forward, `fire: true`
whenever roughly facing the player within machine-gun range. No drift,
turbo, or pickup-weapon use for the bot in this slice — it exists to make
ramming and shooting testable, not to be a tuned opponent.

**Rationale**: Directly matches the spec's Assumptions; reusing the
player's own vehicle/control-step code for the bot (rather than a parallel
movement system) means ramming/collision math (§1) automatically applies
symmetrically to both vehicles with no special-casing.

## 11. Testing approach

**Decision**: Continue 001/003's precedent — Vitest unit tests for pure
logic only (ramming damage formula, archetype stat lookup, weapon cooldown/
lock-on state machines, homing-rocket steering math, oil-slick friction
duration tracking). Combat feel, hit registration, and pickup/mine/oil
behavior are validated via headless-browser scenarios in `quickstart.md`,
consistent with how 001 and 003 validated physics/gesture feel.

**Rationale**: Same reasoning as 001 research.md §5 and 003 research.md
§6 — this project's established, working testing philosophy, not a new
decision.
