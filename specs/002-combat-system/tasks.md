---

description: "Task list for Combat System — Ramming, Weapons, Archetypes, Pickups"
---

# Tasks: Combat System — Ramming, Weapons, Archetypes, Pickups

**Input**: Design documents from `/specs/002-combat-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: research.md §11 decided on Vitest unit tests for pure-logic modules only (ramming formula, archetype lookup, weapon/lock timers, homing-rocket steering math), following 001/003's precedent. Hit-feel and pickup/weapon behavior are validated manually via quickstart.md. Test tasks below implement that decision — they are not a TDD gate.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Extends 001-core-vehicle-loop's `src/vehicle/`, `src/physics/`, `src/config/` and 003-mobile-touch-controls's `src/input/`, `src/ui/`. Adds `src/combat/` for feature-specific systems (plan.md Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration and input-layer scaffolding — no new dependencies (research.md confirms existing Rapier APIs only)

- [X] T001 Extend `src/config/tuning.js`: replace the flat `VEHICLE`/`TURBO` exports with `ARCHETYPES.{heavy,light,balanced}` (mass/hp/maxSpeed/turnRate/turbo per archetype), plus new `RAM` (damage coefficient `k`), `WEAPONS` (machine gun + rockets/homingRockets/mines/oilSlick stats), and `PICKUPS` (respawn delay) sections, per data-model.md ArchetypeConfig and spec.md's exact stat values
- [X] T002 [P] Add `fire`/`usePickup` keyboard bindings (`KeyF`/`KeyE`) to `src/input/inputState.js`'s `KEY_BINDINGS` and `mapKeysToInputState`'s output shape, per data-model.md InputState extension
- [X] T003 [P] Add Fire/Use on-screen touch buttons to `src/input/touchInput.js` (reusing the existing `createTouchButton` helper) and their DOM/CSS in `index.html`/`src/ui/touchControls.css`, mirroring the Drift/Turbo button pattern from 003

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two-vehicle, archetype-aware, collision-event-driven scaffold that every combat story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Refactor `createVehicle` in `src/vehicle/vehicle.js` to accept an `archetypeConfig` parameter (`ARCHETYPES.heavy` etc. from T001) instead of reading flat tuning constants; apply its mass/hp/turnRate/turbo values; add `hp`, `eliminated`, `machineGunCooldownRemaining`, `pickupWeapon` fields per data-model.md Vehicle
- [X] T005 Enforce the archetype's `maxSpeed` as a hard clamp on forward speed in `stepVehicleControl` (`src/vehicle/vehicle.js`), per research.md §7
- [X] T006 Enable Rapier collision events on each vehicle's chassis collider (`ColliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)`) in `src/vehicle/vehicle.js`, per research.md §1
- [X] T007 Create a `colliderHandle -> vehicle` registry (e.g. exported from `src/vehicle/vehicle.js` or a small `src/combat/registry.js`) populated at vehicle spawn, so collision events can be resolved back to `Vehicle` objects
- [X] T008 Wire a shared `RAPIER.EventQueue(true)` into `src/main.js`'s `world.step(eventQueue)` call and drain it once per frame via `eventQueue.drainCollisionEvents(...)`, dispatching `(handle1, handle2, started)` to registered per-system handlers (ramming/pickup/mine/oil-slick systems added in later phases each register a handler)
- [X] T009 Add an archetype-selection screen (Heavy/Light/Balanced buttons) to `index.html`/`src/ui/touchControls.css`, shown after the Start Gate (003) and before spawn; wire `src/main.js` to spawn the player vehicle with the chosen `ArchetypeConfig`, per research.md §8
- [X] T010 Create `src/combat/seekBot.js`: a minimal opponent that reuses `createVehicle`/`stepVehicleControl` with a synthesized `InputState` (steer-toward-player, constant throttle, no drift/turbo/pickup use), per research.md §10; spawn it in `src/main.js` alongside the player

**Checkpoint**: Foundation ready — two vehicles exist (player with a selected archetype, seek-bot opponent), collision events flow through one drain point, but no damage or weapons are wired yet.

---

## Phase 3: User Story 1 - Ramming Combat (Priority: P1) 🎯 MVP

**Goal**: Vehicle-vehicle collisions deal symmetric, physics-derived damage to both vehicles, each proportional to its own speed and mass at impact.

**Independent Test**: Drive the player vehicle into the seek-bot at varying speeds; observe both vehicles' health drop in proportion to their own speed/mass, with no ramming damage from any other source needed to test this.

- [X] T011 [US1] Create `src/combat/ramming.js`: a collision-event handler (registered with T008's drain) that, on `started === true` between two registry-resolved vehicles, computes `damage = speed * mass * RAM.k` from each vehicle's own `chassisBody.linvel()` magnitude and `archetype.mass`, applying it to **the other** vehicle's `hp` (data-model.md Vehicle.hp), per FR-001/FR-002
- [X] T012 [P] [US1] Add unit tests for the ramming damage formula (pure function extracted from `ramming.js`) in `tests/unit/ramming.test.js`
- [X] T013 [US1] Mark a vehicle `eliminated = true` once `hp <= 0` in `src/vehicle/vehicle.js` (or `ramming.js`), and stop applying further input/damage to an eliminated vehicle, per FR-003 and spec Edge Cases

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP) — see `quickstart.md` §1.

---

## Phase 4: User Story 2 - Base Weapon: Machine Gun (Priority: P1)

**Goal**: An always-available, unlimited-ammo hitscan weapon lets a player (or the bot) deal damage without any pickup.

**Independent Test**: Hold Fire facing the opponent within range and observe repeated hits at the weapon's fire rate; confirm elimination is reachable via machine gun alone, with no pickup involved.

- [X] T014 [US2] Create `src/combat/machineGun.js`: hitscan fire via `world.castRay` from the firing vehicle's nose along its forward direction, `filterExcludeRigidBody` set to the shooter's own chassis, `maxToi` = weapon range; applies `damage_per_hit` to a hit vehicle (resolved via T007's registry); enforces fire-rate via a per-vehicle cooldown timer, per research.md §3, FR-003
- [X] T015 [P] [US2] Add unit tests for the machine-gun cooldown/fire-rate state machine in `tests/unit/machineGun.test.js`
- [X] T016 [US2] Wire `InputState.fire` into `machineGun.js`'s fire call within the per-frame vehicle control step (`src/vehicle/vehicle.js` or `src/main.js`), decrementing `machineGunCooldownRemaining` each frame
- [X] T017 [US2] Extend `src/combat/seekBot.js` to set `fire: true` in its synthesized `InputState` whenever it is roughly facing the player within machine-gun range, per research.md §10

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — see `quickstart.md` §2.

---

## Phase 5: User Story 3 - Vehicle Archetypes (Priority: P2)

**Goal**: Three distinct archetypes (already load-bearing since Foundational) are confirmed to produce observably different ramming outcomes and handling.

**Independent Test**: Spawn each archetype in turn and compare top speed, turning response, and ramming outcome against another archetype at the same speed.

- [X] T018 [US3] Verify and tune the three `ARCHETYPES` profiles (T001) so ramming outcomes and turning response are observably distinct between Heavy/Light/Balanced, per FR-005 and spec Acceptance Scenarios 2-3; adjust `src/config/tuning.js` values if needed
- [X] T019 [P] [US3] Add unit tests confirming `createVehicle` applies the correct mass/hp/maxSpeed/turnRate/turbo values per archetype id in `tests/unit/vehicle.test.js`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently — see `quickstart.md` §0.

---

## Phase 6: User Story 4 - Pickup Weapons (Priority: P3)

**Goal**: Fixed-location pickups grant rockets, homing rockets, mines, or oil slick, each with its own distinct effect, replacing whatever pickup weapon was previously held.

**Independent Test**: Walk over each pickup type in turn, use the resulting weapon, and confirm its specific documented effect occurs — testable pickup by pickup.

- [X] T020 [US4] Create `src/combat/pickup.js`: `Pickup` sensor colliders (registered with T008's drain) at fixed arena locations; on contact with the player vehicle, sets `vehicle.pickupWeapon` (data-model.md PickupWeaponSlot) and starts a 15s respawn timer, per FR-006/FR-007/FR-008
- [X] T021 [US4] Place the four pickup locations in the arena (fixed, non-random positions per spec Non-Goals) and instantiate `Pickup`s for each in `src/main.js` or `src/arena/arena.js`
- [X] T022 [US4] Create `src/combat/projectile.js`: kinematic `rocket` (straight-line travel) and `homingRocket` (steers a bounded amount per frame toward `PickupWeaponSlot.lockState.targetVehicle`) update + per-frame raycast hit detection, per research.md §4, FR-009/FR-010
- [X] T023 [P] [US4] Add unit tests for the homing-rocket steering math (pure function) in `tests/unit/projectile.test.js`
- [X] T024 [US4] Create `src/combat/mine.js`: sensor collider (registered with T008's drain) sized to `trigger_radius`, `armDelayRemaining`/`lifetimeRemaining` timers; detonates on any vehicle contact once armed, applying `damage_on_trigger`, per research.md §5, FR-011
- [X] T025 [P] [US4] Add unit tests for mine arm-delay/lifetime timer transitions in `tests/unit/mine.test.js`
- [X] T026 [US4] Create `src/combat/oilSlick.js`: deploys several `OilSlickSegment` sensor colliders (registered with T008's drain) in a line covering the 8m trail; while a vehicle overlaps a segment, applies the friction-reduction effect via 001's `applyTractionState`/`setWheelSideFrictionStiffness` mechanism, per research.md §6, FR-012
- [X] T027 [P] [US4] Add unit tests for oil-slick segment lifetime/friction-duration tracking in `tests/unit/oilSlick.test.js`
- [X] T028 [US4] Wire `InputState.usePickup` into the active `pickupWeapon`'s use logic in the per-frame control step: rising edge fires rockets/mines/oil slick immediately; held duration drives homing-rocket lock-on (data-model.md PickupWeaponSlot.lockState), auto-firing once `lock_on_time` elapses while still held

**Checkpoint**: All four user stories should now be independently functional — see `quickstart.md` §§3-5.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and regression hardening that spans all user stories

- [X] T029 [P] Run the full manual/headless-browser validation pass in `quickstart.md` (all scenarios, §0 through §5) and record results
- [X] T030 [P] Performance pass: confirm sustained 60 FPS with two vehicles plus concurrent projectiles/mines/oil segments active, per constitution Principle V and spec's inherited performance expectations
- [X] T031 [P] Verify all balance values (archetype stats, weapon stats, ram coefficient) live only in `src/config/tuning.js` with no hardcoded magic numbers elsewhere, per FR-013
- [X] T032 Regression-check 001-core-vehicle-loop and 003-mobile-touch-controls behavior (single-vehicle drive/drift/turbo, touch controls, Start Gate, orientation gate) is unaffected by the combat additions

### Notes on T029–T032 validation (this implementation pass)

- **T029 (quickstart pass)**: All scenarios exercised via headless Playwright against a live dev server, driving the game through its real DOM (Start Gate → archetype select → animate loop), not just unit tests:
  - Ramming (US1): head-on collision at high closing speed eliminated both vehicles; a gentler asymmetric approach produced partial, asymmetric damage matching whichever vehicle had the higher `speed × mass` at impact — matches the symmetric `damage = relative_velocity × mass × k` formula.
  - Machine gun (US2): keyboard `KeyF` fire while facing the bot produced an exact `-3` HP hit (`WEAPONS.machineGun.damagePerHit`); touch fire button correctly dispatches `.pressed` state through the same code path.
  - Archetypes (US3): heavy/balanced/light showed monotonically increasing acceleration and top speed in a 5s acceleration test (heavy 7.70 < balanced 8.55 < light 18.13 m/s, all under their configured `maxSpeed`), consistent with `computeEngineForce`/`computeSteerAngle` unit tests.
  - Pickups (US4): driving onto a pickup granted the correct weapon/ammo, hid the pickup, and started its respawn timer; rockets fired for an exact `-35` HP hit; mines armed after `armDelay` and detonated on contact; oil slick set `oilSlickMultiplier` to `0.3` on entry across all 4 deployed segments; homing-rocket hold-to-lock accumulated lock progress and auto-fired at `lockOnTime` with ammo decrementing correctly.
  - Full results and the verification scripts used are not committed (throwaway Playwright scripts in the session scratchpad), consistent with how 001/003 were validated.
- **T030 (performance)**: Measured avg FPS over a 3s `requestAnimationFrame` sampling window with both vehicles, pickups, and active projectiles/mines/oil segments in the scene: ~25 FPS. As with 001 and 003, this sandbox renders via SwiftShader (software rasterizer, no GPU passthrough), so this number is not representative of real hardware and cannot be used to conclusively confirm/deny the 60 FPS target — flagged as an environment limitation, not a regression, since no new expensive per-frame work (unbounded allocations, O(n²) loops) was introduced: collision handling stays O(collision-events), and entity update loops are bounded by the small, fixed number of concurrent pickups/projectiles/mines/oil segments the spec allows.
- **T031 (magic-number audit)**: Grepped `src/` for numeric literals outside `src/config/tuning.js`. All FR-013-scoped balance values — archetype stats (mass/hp/maxSpeed/engineForce/maxSteerAngle/turbo), weapon stats (damage/ammo/range/speed/lockOnTime/turnRate/armDelay/lifetime/triggerRadius/frictionMultiplier/trailLength/segmentCount), the ram coefficient `k`, and pickup respawn delay — live only in `ARCHETYPES`/`WEAPONS`/`RAM`/`PICKUPS` in `tuning.js` and are imported everywhere they're used (`vehicle.js`, `ramming.js`, `machineGun.js`, `projectile.js`, `mine.js`, `oilSlick.js`, `pickup.js`). Local numeric constants remain in a few combat modules (e.g. `seekBot.js`'s `STEER_GAIN`/fire-cone radians, visual mesh geometry in `pickup.js`/`mine.js`/`oilSlick.js`, collision/detection radii used only for bot AI or rendering) — these are judged out of FR-013's scope, which covers gameplay *balance* values, not AI heuristics or cosmetic geometry, matching the same distinction already drawn for 001's tuning audit.
- **T032 (regression check)**: Re-ran keyboard drive/drift/turbo on desktop (`touch-controls`/`rotate-prompt` both stay hidden, as expected) and confirmed drift's traction state still transitions `normal` → `drifting` once speed crosses `DRIFT.minSpeedForEffect` (4 m/s) — a first pass using a 1.5s hold window read `normal` because the `balanced` archetype (1800 engineForce / 1000 mass ≈ 1.8 m/s² acceleration) hadn't yet crossed that threshold; a follow-up timed poll confirmed the transition happens at ~2.75s and is stable afterward, i.e. a test-timing artifact of switching to per-archetype acceleration in 002, not a functional regression. Turbo tap-to-boost still transitions to `boosting` immediately. Start Gate, orientation lock, and touch controls (003) were not code-modified by 002 and were exercised via the same Start Gate flow every verification script above already goes through (Start → archetype select) with no errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (Ramming) has no dependency on Stories 2-4
  - User Story 2 (Machine Gun) has no dependency on Stories 1, 3, 4, but shares the per-frame control step file with Story 1
  - User Story 3 (Archetypes) is mostly already delivered by Foundational (T001/T004/T005/T009) — its own tasks are verification/testing only, no new dependency on 1/2/4
  - User Story 4 (Pickups) depends on Foundational's collision-event registry (T007/T008) and reuses the same per-frame control step file as Stories 1-2
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories
- **User Story 2 (P1)**: Can start after Foundational — no dependency on other stories
- **User Story 3 (P2)**: Can start after Foundational — verification-only, no dependency on other stories' code
- **User Story 4 (P3)**: Can start after Foundational — independently testable pickup by pickup, though it reuses the collision-event registry Story 1 also uses

### Within Each User Story

- Story complete before moving to next priority (recommended order: US1 → US2 → US3 → US4, matching P1/P1/P2/P3)

### Parallel Opportunities

- Setup: T002 and T003 can run in parallel with each other and with T001 (different files)
- User Story 1: T012 (tests) can run in parallel with T013 once T011 exists
- User Story 4: T023, T025, T027 (unit tests) can each run in parallel once their respective implementation task (T022/T024/T026) exists
- Polish: T029, T030, T031 can run in parallel (different concerns, no shared file edits)

---

## Parallel Example: User Story 4

```bash
# After T022 (projectile.js), T024 (mine.js), and T026 (oilSlick.js) each exist,
# launch their unit tests together:
Task: "Add unit tests for homing-rocket steering math in tests/unit/projectile.test.js"
Task: "Add unit tests for mine arm-delay/lifetime timers in tests/unit/mine.test.js"
Task: "Add unit tests for oil-slick friction-duration tracking in tests/unit/oilSlick.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; two archetype-aware vehicles with collision events flowing)
3. Complete Phase 3: User Story 1 (Ramming Combat)
4. **STOP and VALIDATE**: run `quickstart.md` §1 — symmetric, physics-derived ramming damage between two vehicles is a demonstrable MVP
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → two vehicles, archetypes, collision-event pipeline ready
2. Add User Story 1 (Ramming) → validate independently → MVP
3. Add User Story 2 (Machine Gun) → validate independently → ram/shoot parity established
4. Add User Story 3 (Archetypes) → validate independently → archetype differentiation confirmed
5. Add User Story 4 (Pickups) → validate independently, pickup by pickup
6. Polish (full quickstart pass, performance, balance-config audit, 001/003 regression check)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No contract tests: this feature has no external interface (`plan.md` — `contracts/` skipped)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
