# Implementation Plan: Combat System — Ramming, Weapons, Archetypes, Pickups

**Branch**: `002-combat-system` (spec directory id; work is committed on this repo's designated branch, `claude/github-spec-kit-5vpkol`) | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-combat-system/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extends 001-core-vehicle-loop's single-vehicle driving loop into full
combat: symmetric ramming damage derived from Rapier collision events,
a hitscan machine gun, three vehicle archetypes with an explicit selection
screen, and four pickup weapons (rockets, homing rockets, mines, oil
slick) backed by sensor colliders and centrally-configurable balance
values. A minimal seek-bot opponent (reusing the player's own vehicle/
control code) makes ramming and shooting testable. All weapons fire in the
vehicle's facing direction — no independent aim reticle in this slice,
keeping `aimAxis` reserved exactly as 001/003 left it. Two new held
`InputState` fields (`fire`, `usePickup`) are added via the same
keyboard-key + `createTouchButton` pattern 001/003 already established.

## Technical Context

**Language/Version**: Plain JavaScript (ES2022+, ES modules) — no
TypeScript, per constitution Principle I.

**Primary Dependencies**: None new. Uses Rapier's existing `EventQueue`/
collision-events and `castRay` APIs (already part of
`@dimforge/rapier3d-compat`, already a dependency since 001) — no new
package.

**Storage**: N/A — no persistence (consistent with 001/003).

**Testing**: Vitest for pure-logic unit tests (ramming damage formula,
archetype config lookup, machine-gun cooldown, homing-rocket lock/steering
math, mine arm/lifetime timers, oil-slick friction-duration tracking);
manual/headless-browser validation via `quickstart.md` for hit-feel and
pickup/weapon behavior (research.md §11).

**Target Platform**: Browser (WebGL2), static hosting on GitHub Pages —
unchanged; both desktop/keyboard and mobile/touch (003) are extended with
two new input actions each.

**Project Type**: Single-page web application (game) — single project, no
backend. Extends 001's `src/vehicle/`, `src/physics/`, `src/config/` and
003's `src/input/`/`src/ui/` folders; adds `src/combat/`.

**Performance Goals**: No change to the 60 FPS target (constitution
Principle V). New per-frame costs are bounded: one collision-event drain,
a small number of concurrent projectiles/mines/oil segments, and hitscan
raycasts limited by the machine gun's fire rate — all negligible relative
to the existing physics step.

**Constraints**: No backend/server (Principle III); no new dependency
(Principle IV); ramming damage MUST be derived from physics collision data,
never scripted (Principle II); ram and shoot MUST remain co-equal — neither
implemented in a way that makes the other irrelevant (Principle VI).

**Scale/Scope**: Single player vs. one seek-bot opponent, one arena — still
no multiplayer, no networking, no full bot AI (spec Non-Goals; constitution
Non-Goals).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Locked Technology Stack | PASS | No new dependency; uses existing Rapier APIs (collision events, raycasting) already available via `@dimforge/rapier3d-compat`. |
| II. Physics-Accurate Ramming Combat | PASS | Ramming damage computed from live Rapier collision events and rigid-body velocity/mass at the moment of impact (research.md §1) — never scripted. |
| III. Static-Site, No-Backend Architecture | PASS | Purely client-side; no persistence added. |
| IV. Simplicity & YAGNI | PASS | No new dependency. Projectiles/mines/oil use kinematic tracking + Rapier sensors rather than full rigid bodies, justified by absence of any physics-interaction requirement beyond travel/overlap detection (research.md §4-§6). No independent-aim system built since nothing in the spec requires it (research.md §9). |
| V. Performance Budget (60 FPS) | PASS (to be verified) | Bounded new per-frame costs (see Technical Context); validated manually per `quickstart.md`, same approach as 001. |
| VI. Core Loop Lock | PASS | Ramming and machine-gun shooting are built as explicitly co-equal (spec User Stories 1-2, both P1, independently able to reach full elimination — quickstart.md §§1-2). |
| VII. MVP Scope Discipline | PASS | Matches spec.md's Non-Goals (no randomized pickups, no kill-streaks, no weapon upgrades, no full bot AI) and the constitution's MVP scope (single-player vs. bots, one arena). |

No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-combat-system/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory: still a purely client-side rendering/input/
physics loop with no external interface, same as 001 and 003.

### Source Code (repository root)

```text
src/
├── main.js                     # MODIFIED: archetype-selection step after
│                                  Start Gate, spawns player + SeekBot,
│                                  drains the Rapier EventQueue each frame
├── config/
│   └── tuning.js                # MODIFIED: VEHICLE/TURBO become
│                                   ARCHETYPES.{heavy,light,balanced};
│                                   adds WEAPONS, PICKUPS, RAM tuning
├── input/
│   ├── inputState.js            # MODIFIED: adds fire/usePickup keyboard
│   │                               bindings (KeyF/KeyE)
│   └── touchInput.js            # MODIFIED: adds Fire/Use touch buttons
│                                   via the existing createTouchButton helper
├── vehicle/
│   ├── vehicle.js               # MODIFIED: createVehicle(world, scene,
│   │                               archetypeConfig); adds hp/eliminated/
│   │                               machineGunCooldownRemaining/pickupWeapon;
│   │                               enforces archetype max-speed clamp
│   └── (drift.js, turbo.js unchanged)
├── combat/
│   ├── ramming.js                # NEW: collision-event drain -> symmetric
│   │                               damage application (research.md §1)
│   ├── machineGun.js             # NEW: hitscan fire + cooldown
│   ├── projectile.js             # NEW: kinematic rocket/homing-rocket
│   │                               update + hit detection
│   ├── pickup.js                 # NEW: Pickup sensor + respawn timer
│   ├── mine.js                   # NEW: Mine sensor + arm/lifetime timers
│   ├── oilSlick.js               # NEW: OilSlickSegment sensors + friction
│   │                               hook into vehicle traction
│   └── seekBot.js                # NEW: minimal opponent AI (research.md §10)
└── ui/
    ├── touchControls.css         # MODIFIED: Fire/Use button styles,
    │                               archetype-selection screen styles
    └── (archetype selection DOM added to index.html)

tests/
└── unit/
    ├── ramming.test.js
    ├── machineGun.test.js
    ├── projectile.test.js         # homing-rocket steering math
    ├── mine.test.js
    └── oilSlick.test.js
```

**Structure Decision**: New `src/combat/` folder holds the feature-specific
systems (ramming, weapons, pickups, bot) that don't fit 001's existing
`vehicle`/`physics`/`arena`/`camera` folders — each is a distinct concern
per `data-model.md`'s entities. Existing modules (`vehicle.js`,
`inputState.js`, `touchInput.js`, `tuning.js`) are extended in place rather
than duplicated, per research.md's repeated point that this feature reuses
001/003's established patterns instead of inventing parallel ones.

## Complexity Tracking

*No entries — Constitution Check reported no violations.*
