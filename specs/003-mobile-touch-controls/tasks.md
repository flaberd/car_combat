---

description: "Task list for Mobile Touch Controls & Input Auto-Detection"
---

# Tasks: Mobile Touch Controls & Input Auto-Detection

**Input**: Design documents from `/specs/003-mobile-touch-controls/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: research.md §6 decided on Vitest unit tests for pure-logic modules only (mode-detection, joystick drag-to-axis math), following 001's precedent. Touch-gesture feel and orientation-prompt UX are validated manually via quickstart.md. Test tasks below implement that decision — they are not a TDD gate.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Extends 001-core-vehicle-loop's existing `src/input/` folder; adds `src/ui/` for touch-control/rotate-prompt styling. No changes to `src/vehicle/`, `src/physics/`, `src/arena/`, `src/camera/`, or `src/config/tuning.js` (plan.md Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Static scaffolding for the touch UI (no new dependencies — research.md confirms browser-native APIs only)

- [ ] T001 Create `src/ui/touchControls.css`: `touch-action: none` on joystick/button containers, a hidden-by-default utility class for the touch-control layer and the rotate-prompt overlay; link it from `index.html`
- [ ] T002 [P] Add touch-control DOM scaffold to `index.html`: left joystick container, right joystick container, Drift button, Turbo button, and a full-screen rotate-prompt overlay — all hidden by default via the CSS class from T001

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Behavior-neutral scaffold that every user story extends — desktop/keyboard play must still work identically after this phase

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create `src/input/inputController.js` stub: wraps the existing `createKeyboardInput` (`src/input/inputState.js`, unchanged), exposing `read()` (delegates to keyboard) and `isGameplayBlocked()` (hardcoded `false` for now)
- [ ] T004 Update `src/main.js` to call the input controller's `read()`/`isGameplayBlocked()` instead of `keyboardInput` directly, skipping `stepVehicleControl`/`world.step()` for a frame when blocked (data-model.md OrientationGate invariant — no-op until US4 fills in real blocking)

**Checkpoint**: Foundation ready — run `npm run test` and a quick manual keyboard-play smoke check (regression: desktop behavior must be unchanged) before starting user stories.

---

## Phase 3: User Story 1 - Automatic Control Scheme Detection (Priority: P1) 🎯 MVP

**Goal**: The correct control scheme (touch or keyboard) is shown automatically on load, with no settings step, and switches live if real input behavior contradicts the initial guess.

**Independent Test**: Load on a touch-emulated browser and confirm touch controls appear with no keyboard-only UI; load on desktop and confirm no touch controls appear; touch/keypress after load and confirm the scheme switches accordingly.

- [ ] T005 [US1] Implement primary-input detection in `src/input/inputController.js`: `matchMedia('(pointer: coarse) and (hover: none)')` on load sets the initial `mode` (`touch` or `keyboard`), per research.md §1
- [ ] T006 [US1] Implement the runtime override in `src/input/inputController.js`: a real `pointerdown` with `pointerType === 'touch'` switches to `touch` mode; a `keydown` matching an existing bound key (`src/input/inputState.js` `KEY_BINDINGS`) switches to `keyboard` mode; a mouse `pointerdown` never switches modes, per research.md §2, FR-009, and the hybrid-device Edge Case
- [ ] T007 [US1] Add unit tests for the mode-detection and override logic in `tests/unit/inputController.test.js` (fake `matchMedia`/event inputs) per research.md §6
- [ ] T008 [US1] Wire mode changes to show/hide the touch-control DOM (from T002) via the hidden-by-default CSS class from T001, per FR-006

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP) — see `quickstart.md` §1–2.

---

## Phase 4: User Story 2 - Drive and Steer via Touch (Priority: P1)

**Goal**: A left virtual joystick drives the vehicle in touch mode, matching keyboard drive/steer behavior; a right virtual joystick is visible and touchable but unbound.

**Independent Test**: In touch mode, drag the left joystick in various directions and confirm the vehicle accelerates/reverses/steers accordingly and recenters cleanly on release; confirm the right joystick has no gameplay effect.

- [ ] T009 [US2] Create `VirtualJoystick` in `src/input/virtualJoystick.js`: Pointer Events (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) tracked by `pointerId`, drag offset clamped to `maxRadius`, normalized `axis` output, resets to `{0,0}` on release or cancel, per research.md §3, FR-011, data-model.md VirtualJoystick
- [ ] T010 [P] [US2] Add unit tests for the joystick drag-to-axis math in `tests/unit/virtualJoystick.test.js` per research.md §6
- [ ] T011 [US2] Create `src/input/touchInput.js`: instantiates a left (bound) and right (unbound) `VirtualJoystick` against the DOM containers from T002; exposes `read()` producing an `InputState` with `moveAxis` from the left joystick and `aimAxis` computed from the right joystick but not consumed elsewhere, per FR-002/FR-003
- [ ] T012 [US2] Wire `src/input/inputController.js` to delegate `read()` to `touchInput` (T011) when `mode === 'touch'`, per research.md §5

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — see `quickstart.md` §3.

---

## Phase 5: User Story 3 - Drift and Turbo via Touch (Priority: P1)

**Goal**: On-screen Drift and Turbo buttons produce the same `InputState.drift`/`InputState.turbo` behavior as their keyboard equivalents.

**Independent Test**: In touch mode with the vehicle moving, hold the Drift button and confirm the same traction change as keyboard Space; tap the Turbo button and confirm the same boost/cooldown behavior as keyboard Shift, including that repeated taps during boost/cooldown have no extra effect.

- [ ] T013 [US3] Add a `TouchButton` helper in `src/input/touchInput.js` for Drift (held state) and Turbo (edge-triggered on press, mirroring the up-to-down edge pattern already used for keyboard turbo in `src/input/inputState.js`), per data-model.md TouchButton
- [ ] T014 [US3] Wire the Drift/Turbo button DOM elements (from T002) into `touchInput.js`'s `read()` output (`InputState.drift`, `InputState.turbo`), per FR-004/FR-005

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently — see `quickstart.md` §4.

---

## Phase 6: User Story 4 - Landscape-Only Orientation Gate (Priority: P2)

**Goal**: Touch-mode gameplay is blocked with a rotate-device prompt while the device is in portrait, and resumes automatically (without resetting vehicle state) once rotated to landscape. No effect in keyboard mode.

**Independent Test**: In touch mode, rotate to portrait and confirm gameplay blocks with the prompt showing and no vehicle motion; rotate back to landscape and confirm gameplay resumes automatically, continuing from the same vehicle state.

- [ ] T015 [US4] Create `OrientationGate` in `src/input/orientationGate.js`: `matchMedia('(orientation: portrait)')` with a `change` listener tracking `isPortrait`; computes `blocked` per data-model.md invariant (`mode === 'touch' && isPortrait`), per research.md §4, FR-007/FR-010
- [ ] T016 [US4] Wire `src/input/inputController.js`'s `isGameplayBlocked()` to `OrientationGate.blocked` (replacing the T003 stub); show/hide the rotate-prompt overlay (from T002) accordingly, per FR-008
- [ ] T017 [US4] Verify the `src/main.js` game loop (T004) correctly pauses (not resets) `stepVehicleControl`/`world.step()` while blocked, preserving vehicle state across a block/resume cycle, per the mid-drift/turbo Edge Case

**Checkpoint**: All four user stories should now be independently functional — see `quickstart.md` §5.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and regression hardening that spans all user stories

- [ ] T018 [P] Run the full manual/headless-browser validation pass in `quickstart.md` (all 6 scenarios, including the joystick-release edge case) and record results
- [ ] T019 [P] Regression-check desktop/keyboard play against 001-core-vehicle-loop's existing behavior (spec SC-002): no touch controls or rotate prompt appear, drive/drift/turbo behave exactly as before this feature
- [ ] T020 Verify `npm run build` output still serves correctly as static files (no new dependency was added, but confirm the touch-control DOM/CSS and new input modules don't break the existing GitHub Pages deploy compatibility from 001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 has no dependency on Stories 2–4
  - User Stories 2 and 3 both extend `src/input/touchInput.js` (created in Story 2), so Story 3 in practice follows Story 2, though each is independently testable as a behavior once wired in
  - User Story 4 extends `src/input/inputController.js` (created in Foundational, detection logic added in Story 1) and `src/main.js` (Foundational) — independently testable once Story 1 exists, no dependency on Stories 2–3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories
- **User Story 2 (P1)**: Can start after Foundational; independently testable once wired into the controller (Story 1's presence isn't strictly required to drive-test the joystick math, but full mode-driven UI visibility depends on Story 1's T008)
- **User Story 3 (P1)**: Can start after Foundational; shares `touchInput.js` with Story 2 but is independently testable as a behavior
- **User Story 4 (P2)**: Can start after Foundational; independently testable once Story 1's mode detection exists (orientation gating is meaningless without knowing we're in touch mode)

### Within Each User Story

- Story complete before moving to next priority (recommended order: US1 → US2 → US3 → US4, matching P1/P1/P1/P2)

### Parallel Opportunities

- Setup: T002 can run in parallel with T001 (different files: CSS vs. HTML, though T002 references the class T001 defines — coordinate names, or do T001 first)
- User Story 2: T010 (joystick unit tests) can run in parallel with T011 (touchInput.js) once T009 (VirtualJoystick) exists
- Polish: T018 and T019 can run in parallel (different concerns, no shared file edits)

---

## Parallel Example: User Story 2

```bash
# After T009 (VirtualJoystick) is done, launch these together:
Task: "Add unit tests for joystick drag-to-axis math in tests/unit/virtualJoystick.test.js"
Task: "Create src/input/touchInput.js instantiating left/right VirtualJoysticks"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; verify keyboard regression here)
3. Complete Phase 3: User Story 1 (Auto-Detection)
4. **STOP and VALIDATE**: run `quickstart.md` §1–2 — correct control-scheme visibility on load, on both a touch-emulated and a desktop browser, is a demonstrable MVP even before touch controls do anything yet
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready, keyboard play unaffected
2. Add User Story 1 (Auto-Detection) → validate independently → MVP
3. Add User Story 2 (Touch Drive/Steer) → validate independently
4. Add User Story 3 (Touch Drift/Turbo) → validate independently
5. Add User Story 4 (Orientation Gate) → validate independently
6. Polish (full quickstart pass, keyboard regression check, build verification)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No contract tests: this feature has no external interface (`plan.md` — `contracts/` skipped)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
