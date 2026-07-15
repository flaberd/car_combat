# Quickstart: Validating the Core Vehicle Movement Loop

This is a manual validation guide for feature `001-core-vehicle-loop`. It
proves the feature works end-to-end and checks it against the spec's
Success Criteria (`spec.md`). Physics feel and frame rate are validated by
hand here rather than by automated test, per `research.md` §5–6.

## Prerequisites

- Node.js and npm installed.
- Repository checked out with this feature implemented (`src/` populated
  per `plan.md` Project Structure).
- A Chromium- or Firefox-based browser with WebGL2 support.

## Setup

```bash
npm install
npm run dev
```

Open the printed local dev server URL in the browser.

## Automated checks (fast feedback, run before manual playtest)

```bash
npm run test        # Vitest: input-mapping and turbo cooldown state machine
```

All tests MUST pass before proceeding to manual validation.

## Manual validation scenarios

Each scenario maps to an acceptance scenario / success criterion in
`spec.md`.

### 1. Load and immediate control (SC-001)

1. Load the dev server URL.
2. Start a stopwatch on page load; begin driving as soon as controls
   respond.
3. **Expect**: control is possible within 5 seconds of load, with no
   manual setup steps.

### 2. Drive, steer, reverse (US1, SC-002)

1. Hold the forward input. **Expect**: vehicle accelerates forward smoothly
   (not an instant jump to max speed).
2. While moving, hold the steer input. **Expect**: vehicle turns
   continuously; complete a full 360° loop around the arena using steering
   alone.
3. Hold the reverse input. **Expect**: vehicle decelerates, stops, and can
   move backward.
4. Drive directly at an arena boundary wall. **Expect**: vehicle is
   physically stopped/deflected, never passes through.

### 3. Drift (US2, SC-003)

1. Build up speed, then hold the drift input while steering into a turn.
   **Expect**: vehicle visibly slides — reduced grip, wider turning arc —
   distinct from the same turn taken without drift.
2. Release the drift input mid-turn. **Expect**: vehicle returns to normal
   grip/handling.
3. From a standstill, hold the drift input. **Expect**: little to no
   sliding (insufficient momentum).

### 4. Turbo-boost (US3, SC-004)

1. With turbo available, activate it while driving. **Expect**: noticeable,
   temporary speed increase above normal max speed.
2. Immediately try to activate turbo again. **Expect**: no effect — turbo
   is unavailable.
3. Wait out the cooldown, then activate turbo again. **Expect**: boost
   triggers normally, confirming the cooldown → ready transition works.

### 5. Simultaneous drift + turbo (Edge Case)

1. Activate turbo while already drifting (or vice versa). **Expect**: both
   effects apply together (higher speed, reduced traction) without erratic
   physics (no spinning out of control indefinitely, no NaN/frozen state).

### 6. Performance (SC-005)

1. Open browser DevTools → Performance/FPS meter (e.g., Chrome's
   `Rendering` tab → "Frame Rendering Stats").
2. Drive continuously (including drift and turbo) for at least 60 seconds.
3. **Expect**: frame rate sustains ~60 FPS on the primary development
   hardware, with no motion that appears to skip/teleport rather than
   flow from physics.

## Done criteria

All six scenarios above behave as expected, and `npm run test` passes.
This satisfies `spec.md`'s Success Criteria SC-001 through SC-005.
