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

- [X] T001 Create `src/ui/touchControls.css`: `touch-action: none` on joystick/button containers, a hidden-by-default utility class for the touch-control layer and the rotate-prompt overlay; link it from `index.html`
- [X] T002 [P] Add touch-control DOM scaffold to `index.html`: left joystick container, right joystick container, Drift button, Turbo button, and a full-screen rotate-prompt overlay — all hidden by default via the CSS class from T001

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Behavior-neutral scaffold that every user story extends — desktop/keyboard play must still work identically after this phase

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create `src/input/inputController.js` stub: wraps the existing `createKeyboardInput` (`src/input/inputState.js`, unchanged), exposing `read()` (delegates to keyboard) and `isGameplayBlocked()` (hardcoded `false` for now)
- [X] T004 Update `src/main.js` to call the input controller's `read()`/`isGameplayBlocked()` instead of `keyboardInput` directly, skipping `stepVehicleControl`/`world.step()` for a frame when blocked (data-model.md OrientationGate invariant — no-op until US4 fills in real blocking)

**Checkpoint**: Foundation ready — run `npm run test` and a quick manual keyboard-play smoke check (regression: desktop behavior must be unchanged) before starting user stories.

---

## Phase 3: User Story 1 - Automatic Control Scheme Detection (Priority: P1) 🎯 MVP

**Goal**: The correct control scheme (touch or keyboard) is shown automatically on load, with no settings step, and switches live if real input behavior contradicts the initial guess.

**Independent Test**: Load on a touch-emulated browser and confirm touch controls appear with no keyboard-only UI; load on desktop and confirm no touch controls appear; touch/keypress after load and confirm the scheme switches accordingly.

- [X] T005 [US1] Implement primary-input detection in `src/input/inputController.js`: `matchMedia('(pointer: coarse) and (hover: none)')` on load sets the initial `mode` (`touch` or `keyboard`), per research.md §1
- [X] T006 [US1] Implement the runtime override in `src/input/inputController.js`: a real `pointerdown` with `pointerType === 'touch'` switches to `touch` mode; a `keydown` matching an existing bound key (`src/input/inputState.js` `KEY_BINDINGS`) switches to `keyboard` mode; a mouse `pointerdown` never switches modes, per research.md §2, FR-009, and the hybrid-device Edge Case
- [X] T007 [US1] Add unit tests for the mode-detection and override logic in `tests/unit/inputController.test.js` (fake `matchMedia`/event inputs) per research.md §6
- [X] T008 [US1] Wire mode changes to show/hide the touch-control DOM (from T002) via the hidden-by-default CSS class from T001, per FR-006

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP) — see `quickstart.md` §1–2.

---

## Phase 4: User Story 2 - Drive and Steer via Touch (Priority: P1)

**Goal**: A left virtual joystick drives the vehicle in touch mode, matching keyboard drive/steer behavior; a right virtual joystick is visible and touchable but unbound.

**Independent Test**: In touch mode, drag the left joystick in various directions and confirm the vehicle accelerates/reverses/steers accordingly and recenters cleanly on release; confirm the right joystick has no gameplay effect.

- [X] T009 [US2] Create `VirtualJoystick` in `src/input/virtualJoystick.js`: Pointer Events (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) tracked by `pointerId`, drag offset clamped to `maxRadius`, normalized `axis` output, resets to `{0,0}` on release or cancel, per research.md §3, FR-011, data-model.md VirtualJoystick
- [X] T010 [P] [US2] Add unit tests for the joystick drag-to-axis math in `tests/unit/virtualJoystick.test.js` per research.md §6
- [X] T011 [US2] Create `src/input/touchInput.js`: instantiates a left (bound) and right (unbound) `VirtualJoystick` against the DOM containers from T002; exposes `read()` producing an `InputState` with `moveAxis` from the left joystick and `aimAxis` computed from the right joystick but not consumed elsewhere, per FR-002/FR-003
- [X] T012 [US2] Wire `src/input/inputController.js` to delegate `read()` to `touchInput` (T011) when `mode === 'touch'`, per research.md §5

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — see `quickstart.md` §3.

---

## Phase 5: User Story 3 - Drift and Turbo via Touch (Priority: P1)

**Goal**: On-screen Drift and Turbo buttons produce the same `InputState.drift`/`InputState.turbo` behavior as their keyboard equivalents.

**Independent Test**: In touch mode with the vehicle moving, hold the Drift button and confirm the same traction change as keyboard Space; tap the Turbo button and confirm the same boost/cooldown behavior as keyboard Shift, including that repeated taps during boost/cooldown have no extra effect.

- [X] T013 [US3] Add a `TouchButton` helper in `src/input/touchInput.js` for Drift (held state) and Turbo (edge-triggered on press, mirroring the up-to-down edge pattern already used for keyboard turbo in `src/input/inputState.js`), per data-model.md TouchButton
- [X] T014 [US3] Wire the Drift/Turbo button DOM elements (from T002) into `touchInput.js`'s `read()` output (`InputState.drift`, `InputState.turbo`), per FR-004/FR-005

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently — see `quickstart.md` §4.

---

## Phase 6: User Story 4 - Landscape-Only Orientation Gate (Priority: P2)

**Goal**: Touch-mode gameplay is blocked with a rotate-device prompt while the device is in portrait, and resumes automatically (without resetting vehicle state) once rotated to landscape. No effect in keyboard mode.

**Independent Test**: In touch mode, rotate to portrait and confirm gameplay blocks with the prompt showing and no vehicle motion; rotate back to landscape and confirm gameplay resumes automatically, continuing from the same vehicle state.

- [X] T015 [US4] Create `OrientationGate` in `src/input/orientationGate.js`: `matchMedia('(orientation: portrait)')` with a `change` listener tracking `isPortrait`; computes `blocked` per data-model.md invariant (`mode === 'touch' && isPortrait`), per research.md §4, FR-007/FR-010
- [X] T016 [US4] Wire `src/input/inputController.js`'s `isGameplayBlocked()` to `OrientationGate.blocked` (replacing the T003 stub); show/hide the rotate-prompt overlay (from T002) accordingly, per FR-008
- [X] T017 [US4] Verify the `src/main.js` game loop (T004) correctly pauses (not resets) `stepVehicleControl`/`world.step()` while blocked, preserving vehicle state across a block/resume cycle, per the mid-drift/turbo Edge Case

**Checkpoint**: All four user stories should now be independently functional — see `quickstart.md` §5.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and regression hardening that spans all user stories

- [X] T018 [P] Run the full manual/headless-browser validation pass in `quickstart.md` (all 6 scenarios, including the joystick-release edge case) and record results — see Notes below
- [X] T019 [P] Regression-check desktop/keyboard play against 001-core-vehicle-loop's existing behavior (spec SC-002): no touch controls or rotate prompt appear, drive/drift/turbo behave exactly as before this feature
- [X] T020 Verify `npm run build` output still serves correctly as static files (no new dependency was added, but confirm the touch-control DOM/CSS and new input modules don't break the existing GitHub Pages deploy compatibility from 001)

### Notes on T018–T020 validation (this implementation pass)

All 6 quickstart.md scenarios were exercised end-to-end via headless-browser
device emulation (touch-emulated phone profile and plain desktop context):

1. Auto-detection on load: desktop stays keyboard-only (no touch UI);
   touch-emulated device shows touch controls automatically.
2. Runtime override: a bound keydown while in touch mode switches to
   keyboard (UI hides); a real touch pointerdown switches to touch. A plain
   mouse pointerdown never switches modes.
3. Touch drive/steer: dragging the left joystick physically moves the
   vehicle (~2.8 units over a 2s forward drag); the right joystick has no
   gameplay effect.
4. Touch drift/turbo: holding Drift at sufficient speed (>4 units, matching
   001's `DRIFT.minSpeedForEffect`) flips `tractionState` to `drifting` and
   back on release; tapping Turbo transitions `ready -> boosting`, with a
   repeat tap during boost correctly ignored.
5. Orientation gate: rotating a touch-emulated viewport to portrait shows
   the rotate prompt and freezes vehicle position exactly (verified via two
   position samples 1s apart being identical); rotating back to landscape
   hides the prompt and resumes from the same (not reset) position.
6. Joystick release edge case: both `pointercancel` and a `pointerup`
   dispatched with off-screen coordinates correctly recenter the joystick
   knob to `translate(0px, 0px)`.

T019: a full keyboard-only regression pass (drive, drift, turbo, ~7.3 units
travelled) confirmed identical behavior to 001-core-vehicle-loop, with no
touch UI or rotate prompt ever appearing.

T020: `dist/` served via a plain static HTTP server (no dev server, no new
dependency) on a touch-emulated profile loaded and showed touch controls
correctly, confirming GitHub Pages compatibility is preserved.

60 FPS was not re-measured in this pass (carried caveat from
001-core-vehicle-loop: this sandboxed environment only has SwiftShader
software rendering) — this feature adds negligible per-frame cost
(event-driven input, no new rendering/physics load) so the same real-hardware
re-verification noted for 001 applies here too, not a new concern.

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

---

## Phase 8: User Story 5 - Start Gate: Fullscreen and Forced Landscape (Priority: P1) [AMENDMENT]

**Added post-implementation**: real-world testing found that User Story 4's
orientation gate depends on `matchMedia`, which never fires if the player's
OS has auto-rotate locked (screen rotation disabled) — a very common
setting. This phase adds a Start button that, on a genuine tap (the user
gesture both `requestFullscreen()` and `screen.orientation.lock()` require),
forces fullscreen + landscape on supporting browsers regardless of the OS
rotation-lock switch. See `research.md` §7, `data-model.md` StartGate,
spec.md User Story 5 / FR-012–FR-015 / SC-006.

**Goal**: No gameplay is visible/interactive until Start is tapped; tapping
it on a touch device requests fullscreen and attempts to force landscape;
on keyboard it just starts the game.

**Independent Test**: Load the game, confirm only a Start button is
visible; tap/click it and confirm gameplay begins (plus fullscreen +
landscape on a touch device where the browser supports locking).

- [X] T021 [US5] Add a Start button/overlay to `index.html` (`src/ui/touchControls.css` or a new stylesheet section) that covers the whole screen, hides the canvas/touch-controls behind it, and is removed/hidden once tapped
- [X] T022 [US5] Create `src/input/startGate.js`: `StartGate` per data-model.md — `started` state, one-way `false -> true` transition; exposes `start()` that, when called with `mode === 'touch'`, attempts `document.documentElement.requestFullscreen()` then (only on success) `screen.orientation.lock('landscape')`, swallowing any rejection/exception from either (FR-013); no-ops those calls when `mode === 'keyboard'` (FR-015)
- [X] T023 [US5] Wire `src/main.js`: do not start the render/physics loop until `StartGate.started` is true; the Start button's click handler calls `startGate.start(inputController.getMode())` then begins the loop, per FR-012
- [X] T024 [P] [US5] Update `specs/003-mobile-touch-controls/quickstart.md` with a "Scenario 0: Start Gate" step (tap Start before any other scenario can be exercised) and note the touch-only fullscreen/lock behavior

**Checkpoint**: Start Gate functional — see `quickstart.md` Scenario 0. Re-run Scenarios 1–6 to confirm they still work with the Start Gate in front of them.

---

## Phase 9: Polish (Amendment)

- [X] T025 [P] Re-run the full `quickstart.md` pass (Scenario 0 plus the original 6) confirming nothing regressed by adding the Start Gate in front of existing flows
- [X] T026 [P] Headless-browser verification of the Start button's fullscreen/orientation-lock attempt and its graceful no-op fallback, acknowledging that headless Chromium has limited/no real Fullscreen API support — document what could and couldn't be verified this way, same honesty standard as the 60 FPS caveat from 001/003

### Notes on T025–T026 validation (this amendment pass)

- **Desktop**: Start button visible pre-click, nothing else; clicking it
  hides the Start Gate and starts the game with zero fullscreen/orientation
  calls attempted (keyboard mode short-circuits `StartGate.start()`),
  confirmed via `document.fullscreenElement` staying `null`.
- **Touch-emulated**: tapping Start hid the Start Gate and the game started
  (touch controls became visible, and a joystick drag afterward moved the
  vehicle, confirming full playability) — this held regardless of the
  fullscreen/lock outcome, which is the FR-013 guarantee under test.
- In this specific headless-Chromium sandbox, `requestFullscreen()` actually
  **succeeded** (`document.fullscreenElement` was set) when triggered by a
  Playwright-dispatched click, but `screen.orientation.lock('landscape')`
  did **not** change the reported orientation (`screen.orientation.type`
  stayed `portrait-primary`) — i.e. this environment exercised exactly the
  "fullscreen works, lock doesn't" fallback branch (research.md §7), and
  the game still started and remained fully playable, confirming FR-013/
  FR-014's fallback path works, not just the all-succeeds happy path.
- Real-device behavior (genuine Android Chrome forcing landscape despite an
  OS rotation lock; iOS Safari's actual fullscreen/lock support) still
  needs manual confirmation on physical hardware — headless emulation
  cannot fully stand in for real OS-level rotation-lock interaction, same
  category of caveat as the carried-over 60 FPS note.
