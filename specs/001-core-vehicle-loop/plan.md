# Implementation Plan: Core Vehicle Movement Loop

**Branch**: `001-core-vehicle-loop` (spec directory id; work is committed on this repo's designated branch, `claude/github-spec-kit-5vpkol`) | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-core-vehicle-loop/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A single player drives a physics-simulated vehicle (Rapier raycast vehicle
controller) around a grey-box arena in third-person view, with drive/steer,
drift, and turbo-boost as the core controllable mechanics, per the
constitution's "lock core loop first" principle. Technical approach: Three.js
renders a primitive-geometry arena and vehicle; `@dimforge/rapier3d-compat`
drives all vehicle motion; drift and turbo are implemented as tuning-time
adjustments to the vehicle controller (side friction, engine force) rather
than separate physics systems; keyboard input is mapped to a two-axis
`InputState` that already reserves a second axis for the next feature's
aim/fire input.

## Technical Context

**Language/Version**: Plain JavaScript (ES2022+, ES modules) — no
TypeScript, per constitution Principle I.

**Primary Dependencies**: Three.js (rendering), `@dimforge/rapier3d-compat`
(physics + raycast vehicle controller), Vite (build/dev server). Vitest as a
dev-only dependency for unit tests (see `research.md` §5 — treated as part
of "Vite tooling," not a new framework).

**Storage**: N/A — no persistence in this slice (spec Assumptions).

**Testing**: Vitest for pure-logic unit tests (input mapping, turbo cooldown
state machine); manual playtest via `quickstart.md` for physics feel and
frame rate (see `research.md` §5).

**Target Platform**: Browser (WebGL2), static hosting on GitHub Pages;
keyboard input only in this slice (constitution Platform & Controls).

**Project Type**: Single-page web application (game) — single project,
no backend.

**Performance Goals**: Sustained 60 FPS during normal driving on the primary
development hardware (spec SC-005; constitution Principle V).

**Constraints**: No backend/server (Principle III); locked stack only
(Principle I); all vehicle motion must originate from Rapier's raycast
vehicle controller, never scripted transforms (Principle II).

**Scale/Scope**: Single vehicle, single player, one grey-box arena scene —
no opponents, no networking (spec Assumptions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Locked Technology Stack | PASS | Three.js, Rapier raycast vehicle controller, Vite, vanilla JS, GitHub Pages hosting — no deviation. |
| II. Physics-Accurate Ramming Combat | N/A (this slice) | No ramming/combat in 001; the requirement that vehicle motion is Rapier-driven (not scripted) is honored and carries forward into 002. |
| III. Static-Site, No-Backend Architecture | PASS | Purely client-side; no server, no persistence needed. |
| IV. Simplicity & YAGNI | PASS | No framework; only dependency addition beyond Three.js/Rapier/Vite is Vitest, justified in `research.md` §5 as within "Vite tooling" and tied to a concrete current need (testing pure input/state logic). Grey-box uses Three.js primitives instead of introducing `.glb` asset authoring before it's needed (`research.md` §3). |
| V. Performance Budget (60 FPS) | PASS (to be verified) | Explicit Technical Context goal; validated manually per `research.md` §6 and `quickstart.md` §6, no new dependency added. |
| VI. Core Loop Lock | PASS | This *is* the first "lock core loop first" slice — grey-box only, drift and turbo present from the first driveable prototype, no presentation/polish work included. |
| VII. MVP Scope Discipline | PASS | Single vehicle, no bots, no multiplayer, no destructible objects, no HUD beyond what's needed — matches spec's explicit out-of-scope list. |

No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-vehicle-loop/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory: this feature exposes no external interface (no
API, no CLI, no cross-service contract) — it's a purely client-side
rendering/input/physics loop. Skipped per the Phase 1 instruction to omit
contracts for purely internal projects.

### Source Code (repository root)

```text
index.html               # Vite entry HTML, canvas root
package.json
vite.config.js

src/
├── main.js               # Entry point: sets up renderer, physics world, camera, game loop
├── config/
│   └── tuning.js          # Centrally editable constants (turbo, drift, engine force) — see data-model.md
├── input/
│   └── inputState.js      # Keyboard -> InputState (moveAxis, aimAxis, drift, turbo) mapping
├── physics/
│   └── world.js           # Rapier world init (RAPIER.init(), world creation, step)
├── vehicle/
│   ├── vehicle.js          # Vehicle: chassis body + DynamicRayCastVehicleController wiring
│   ├── drift.js            # Traction-state logic (normal <-> drifting) applied to controller
│   └── turbo.js            # TurboState state machine (ready/boosting/cooling_down)
├── arena/
│   └── arena.js            # Grey-box ground + boundary colliders and meshes
└── camera/
    └── followCamera.js     # Damped third-person follow camera

tests/
└── unit/
    ├── inputState.test.js
    └── turbo.test.js
```

**Structure Decision**: Single project (Option 1), adapted for a Vite
browser game with no `models`/`services`/`cli`/`lib` split — folders are
organized by gameplay concern (`input`, `physics`, `vehicle`, `arena`,
`camera`) since this is a small, single-project game rather than a
library/service. This mirrors `data-model.md`'s entities directly: each
major entity/subsystem gets its own module. `tests/unit/` holds the Vitest
suite from `research.md` §5; there is no `tests/contract/` (no external
contracts, see above) and no `tests/integration/` (physics/feel is
validated manually per `quickstart.md`, not via automated integration
tests, per `research.md` §5).

## Complexity Tracking

*No entries — Constitution Check reported no violations.*
