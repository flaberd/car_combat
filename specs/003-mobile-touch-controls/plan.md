# Implementation Plan: Mobile Touch Controls & Input Auto-Detection

**Branch**: `003-mobile-touch-controls` (spec directory id; work is committed on this repo's designated branch, `claude/github-spec-kit-5vpkol`) | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-mobile-touch-controls/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extends 001-core-vehicle-loop's input layer so the game is playable from a
phone browser, with the correct control scheme (touch vs. keyboard) enabled
automatically and no settings UI. Technical approach: detect the primary
input mechanism via `matchMedia('(pointer: coarse) and (hover: none)')` on
load, with a live override the moment a real touch or a real bound keypress
contradicts that guess; render dual virtual joysticks (Pointer Events API)
plus Drift/Turbo buttons that feed the *same* `InputState` shape 001 already
defined (`moveAxis`, `aimAxis`, `drift`, `turbo`) so nothing downstream
(`src/vehicle/*.js`, `src/physics/*.js`) needs to change; and gate gameplay
behind a landscape-only orientation check (`matchMedia('(orientation: portrait)')`)
that pauses (not resets) the game loop and shows a rotate-device prompt,
active only in touch mode.

## Technical Context

**Language/Version**: Plain JavaScript (ES2022+, ES modules) — no
TypeScript, per constitution Principle I. No new build dependency.

**Primary Dependencies**: None new. Uses the browser's built-in Pointer
Events API and CSS Media Queries (`matchMedia`) — no touch/gesture library
added, consistent with Principle IV (justify new dependencies against
concrete need; none exists here).

**Storage**: N/A — no persistence (spec Assumptions: detection runs fresh
each load).

**Testing**: Vitest for pure-logic unit tests (mode-decision function,
joystick drag-to-axis math); manual/headless-browser validation via
`quickstart.md` for touch-gesture feel and orientation-prompt UX
(`research.md` §6).

**Target Platform**: Browser (WebGL2), static hosting on GitHub Pages —
now explicitly including mobile/touch browsers per constitution v1.2.0, in
addition to the existing desktop/keyboard target.

**Project Type**: Single-page web application (game) — single project, no
backend. Extends 001's existing structure rather than introducing a new
top-level split.

**Performance Goals**: No change to 001's 60 FPS target (constitution
Principle V); this feature adds event listeners and small per-frame math,
not rendering/physics load.

**Constraints**: No backend/server (Principle III); no new dependency
(Principle IV); must not alter `InputState`'s shape or 001's vehicle/physics
modules (research.md §5) — this is additive at the input-source layer only.

**Scale/Scope**: Single vehicle, single player — unchanged from 001. This
feature only changes *how* `InputState` gets produced, not what consumes it.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Locked Technology Stack | PASS | No new dependency; browser-native Pointer Events + Media Queries only. |
| II. Physics-Accurate Ramming Combat | N/A (this feature) | No combat in this slice; touch input feeds the same Rapier-driven control step 001 already established. |
| III. Static-Site, No-Backend Architecture | PASS | Purely client-side; no persistence added. |
| IV. Simplicity & YAGNI | PASS | No new dependency added; reuses 001's `InputState` shape rather than inventing a parallel one (research.md §5). |
| V. Performance Budget (60 FPS) | PASS | No rendering/physics load added; event-driven input handling is negligible per-frame cost. |
| VI. Core Loop Lock | PASS | This is control-layer work on the already-locked core loop (drive/drift/turbo), not new mechanics or presentation/polish scope creep. |
| VII. MVP Scope Discipline | PASS | Explicitly scoped per constitution v1.2.0's Platform & Controls amendment; Non-Goals in spec.md keep gamepad, Capacitor packaging, and combat/aim out of this feature. |

No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-mobile-touch-controls/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory: this feature exposes no external interface — it
remains a purely client-side rendering/input/physics loop, same as 001.

### Source Code (repository root)

```text
src/
├── main.js                    # MODIFIED: reads InputController instead of
│                                 keyboardInput directly; skips the physics/
│                                 control step while orientation-gated
├── input/
│   ├── inputState.js           # UNCHANGED: existing keyboard mapping, still used as-is
│   ├── inputController.js      # NEW: mode detection + switching (research.md §1-2),
│   │                              exposes read() and isGameplayBlocked()
│   ├── touchInput.js           # NEW: createTouchInput() — wires up VirtualJoystick
│   │                              and TouchButton instances, produces InputState
│   ├── virtualJoystick.js      # NEW: VirtualJoystick class/factory (research.md §3)
│   └── orientationGate.js      # NEW: OrientationGate (research.md §4, data-model.md)
├── ui/
│   └── touchControls.css       # NEW: on-screen joystick/button styling +
│                                  touch-action: none, rotate-prompt overlay styling
index.html                      # MODIFIED: touch-controls DOM (joysticks,
│                                  buttons, rotate-prompt overlay), initially
│                                  hidden; stylesheet link

tests/
└── unit/
    ├── inputController.test.js  # NEW: mode-decision logic
    └── virtualJoystick.test.js  # NEW: drag-to-axis math
```

**Structure Decision**: Extends 001's existing `src/input/` folder rather
than creating a new top-level module — this is additional input-source code,
not a new subsystem. A small `src/ui/` folder is introduced for the
touch-control and rotate-prompt CSS, since 001 had no on-screen UI beyond
the 3D scene. `src/vehicle/*.js`, `src/physics/*.js`, `src/arena/*.js`,
`src/camera/*.js`, and `src/config/tuning.js` are untouched by this feature
(research.md §5) — the plan intentionally shows no changes to them.

## Complexity Tracking

*No entries — Constitution Check reported no violations.*
