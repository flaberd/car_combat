---

description: "Task list for Core Vehicle Movement Loop"
---

# Tasks: Core Vehicle Movement Loop

**Input**: Design documents from `/specs/001-core-vehicle-loop/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: research.md §5 decided on Vitest unit tests for pure-logic modules only (input mapping, turbo state machine); physics feel is validated manually via quickstart.md, not automated tests. Test tasks below implement that decision — they are not a TDD gate.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project (browser game), per `plan.md` Project Structure — `src/` and `tests/` at repository root, organized by gameplay concern (`input/`, `physics/`, `vehicle/`, `arena/`, `camera/`, `config/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization

- [X] T001 Initialize Vite project scaffold: `package.json` (with `dev`, `build`, `test` npm scripts), `vite.config.js`, `index.html` (canvas root) at repository root
- [X] T002 Install dependencies: `three`, `@dimforge/rapier3d-compat` as dependencies; `vite`, `vitest` as devDependencies (per `plan.md` Primary Dependencies, `research.md` §1/§5)
- [X] T003 [P] Create `src/config/tuning.js` with placeholder tuning constants (engine force, steering limit, drift side-friction multiplier, turbo boost strength/duration, turbo cooldown duration) per `data-model.md` "Tuning Configuration"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Set up Rapier physics world in `src/physics/world.js` (`await RAPIER.init()`, world creation with gravity, `step()` wrapper) per `research.md` §1
- [X] T005 [P] Create grey-box arena in `src/arena/arena.js`: ground plane and boundary colliders (Rapier fixed rigid bodies) plus matching Three.js primitive meshes, per `data-model.md` Arena entity and FR-008
- [X] T006 [P] Create damped third-person follow camera in `src/camera/followCamera.js` (per-frame lerp toward an offset target behind/above the tracked body) per `research.md` §4
- [X] T007 Create keyboard-to-`InputState` mapping in `src/input/inputState.js` (`moveAxis {x,y}`, `aimAxis` fixed at `{0,0}`, `drift` boolean, `turbo` boolean) per `data-model.md` InputState and FR-002/FR-003/FR-004/FR-005/FR-007
- [X] T008 [P] Add unit tests for keyboard-to-`InputState` mapping in `tests/unit/inputState.test.js` per `research.md` §5
- [X] T009 Wire up `src/main.js`: renderer setup, physics world step loop, arena instantiation, camera attach, per-frame `InputState` polling, render loop

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Drive and Steer the Vehicle (Priority: P1) 🎯 MVP

**Goal**: A player can accelerate, reverse, and steer a physics-driven vehicle around the grey-box arena, contained by its boundaries.

**Independent Test**: Load the game, hold forward/reverse/steer inputs, and observe the vehicle move under physics-driven motion; drive into a boundary and confirm it's physically blocked.

- [X] T010 [US1] Create `Vehicle` in `src/vehicle/vehicle.js`: chassis rigid body plus Rapier `DynamicRayCastVehicleController` with 4 raycast wheels, per `data-model.md` Vehicle entity, `research.md` §2, FR-009
- [X] T011 [US1] Implement the drive/steer control step in `src/vehicle/vehicle.js`: map `InputState.moveAxis` to engine force (forward/reverse) and steering angle on the vehicle controller, using constants from `src/config/tuning.js`, per FR-002/FR-003
- [X] T012 [US1] Integrate the vehicle into `src/main.js`: spawn it in the arena, step the vehicle controller each frame alongside the physics world, attach the follow camera (`src/camera/followCamera.js`) to the chassis
- [X] T013 [US1] Verify and tune boundary collision behavior against `src/arena/arena.js` boundary colliders (vehicle must be physically stopped/deflected, never pass through) per FR-008 and spec Edge Cases

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP) — see `quickstart.md` §1–2, §6.

---

## Phase 4: User Story 2 - Drift (Priority: P1)

**Goal**: Holding a drift input while cornering at speed shifts the vehicle into a distinct, lower-traction handling state.

**Independent Test**: While moving at speed and turning, hold the drift input and observe a visibly different handling state (sliding) versus normal turning; release it and confirm normal handling returns.

- [X] T014 [US2] Implement traction-state logic in `src/vehicle/drift.js`: `normal` ↔ `drifting` transitions that adjust the vehicle controller's per-wheel side-friction value, using the multiplier from `src/config/tuning.js`, per `data-model.md` Vehicle.tractionState, `research.md` §2, FR-004
- [X] T015 [US2] Wire `InputState.drift` into the control step in `src/vehicle/vehicle.js`: activate/deactivate `src/vehicle/drift.js` logic each frame, with no meaningful effect below a minimum-speed threshold, per spec Edge Cases

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — see `quickstart.md` §3.

---

## Phase 5: User Story 3 - Turbo-Boost (Priority: P2)

**Goal**: A rate-limited turbo-boost temporarily increases vehicle speed, then enforces a cooldown before it can be used again.

**Independent Test**: With turbo available, activate it and observe a temporary speed increase; attempt immediate reactivation and confirm it's blocked until the cooldown elapses.

- [X] T016 [US3] Implement the `TurboState` state machine in `src/vehicle/turbo.js`: `ready` → `boosting` → `cooling_down` → `ready` transitions with elapsed-time tracking, using boost/cooldown durations from `src/config/tuning.js`, per `data-model.md` TurboState, FR-005/FR-006
- [X] T017 [P] [US3] Add unit tests for the `TurboState` transitions in `tests/unit/turbo.test.js` per `research.md` §5
- [X] T018 [US3] Wire `InputState.turbo` into the control step in `src/vehicle/vehicle.js`: apply boosted engine force while `boosting`, and gate reactivation until `TurboState` returns to `ready`

**Checkpoint**: All user stories should now be independently functional — see `quickstart.md` §4–5.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and hardening that spans all user stories

- [X] T019 [P] Run the full manual validation pass in `quickstart.md` (all 6 scenarios) and record results — see Notes below
- [X] T020 [P] Performance pass: confirm sustained 60 FPS per `quickstart.md` §6 (DevTools FPS meter) during combined drive/drift/turbo play; profile and tune the render/physics step in `src/main.js` if the target isn't met, per spec SC-005 — see Notes below (environment caveat)
- [X] T021 Verify `npm run build` output (`dist/`) runs correctly when served as static files, confirming compatibility with `.github/workflows/deploy.yml`

### Notes on T019–T021 validation (this implementation pass)

Scenarios 1–5 of `quickstart.md` were exercised end-to-end via a headless
browser (load, drive/steer, boundary collision, drift, turbo boost/cooldown,
simultaneous drift+turbo) — all behaved as specified, with no runtime errors
and physics-driven motion confirmed via chassis position/state readouts.

Scenario 6 (60 FPS) could **not** be conclusively validated in this sandboxed
execution environment: it only has SwiftShader software WebGL rendering
(confirmed via `UNMASKED_RENDERER_WEBGL`), which measured ~25 FPS on this
trivial grey-box scene — a software-rendering ceiling, not a code
performance problem. This must be re-verified on real GPU hardware per
`quickstart.md` §6 before considering SC-005 fully satisfied.

T021 was verified by building `dist/` and serving it with a plain static
file server (no dev server, simulating GitHub Pages), confirming the game
loads and runs identically — `vite.config.js`'s `base: "./"` produces
relative asset paths compatible with GitHub Pages project-page hosting.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 has no dependency on Story 2 or 3
  - User Stories 2 and 3 both extend the `Vehicle`/control step created in User Story 1 (same files: `src/vehicle/vehicle.js`), so in practice they proceed after Story 1's `vehicle.js` exists, even though each is independently testable as a behavior once wired in
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on other stories
- **User Story 2 (P1)**: Can start after Foundational; integrates into the `Vehicle` control step from User Story 1, but is independently testable as a behavior
- **User Story 3 (P2)**: Can start after Foundational; integrates into the `Vehicle` control step from User Story 1, but is independently testable as a behavior

### Within Each User Story

- Story complete before moving to next priority (recommended sequential order: US1 → US2 → US3, matching P1/P1/P2)

### Parallel Opportunities

- Setup: T003 can run in parallel with T001–T002 completing (different file)
- Foundational: T005 and T006 can run in parallel with each other (different files); T008 can run in parallel once T007 exists (test file, separate from implementation file)
- Polish: T019 and T020 can run in parallel (different concerns, no shared file edits)

---

## Parallel Example: Foundational Phase

```bash
# After T004 (physics world) is done, launch these together:
Task: "Create grey-box arena in src/arena/arena.js"
Task: "Create damped third-person follow camera in src/camera/followCamera.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Drive and Steer)
4. **STOP and VALIDATE**: run `quickstart.md` §1–2, §6 — a drivable, physics-correct vehicle in a grey-box arena at 60 FPS is a demonstrable MVP
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 (Drive/Steer) → validate independently → MVP
3. Add User Story 2 (Drift) → validate independently
4. Add User Story 3 (Turbo) → validate independently
5. Polish (full quickstart pass, performance, build verification)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No contract tests: this feature has no external interface (`plan.md` — `contracts/` skipped)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
