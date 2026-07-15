# Quickstart: Validating Mobile Touch Controls & Input Auto-Detection

Manual/headless-browser validation guide for `003-mobile-touch-controls`,
mapped to `spec.md`'s acceptance scenarios and success criteria. Per
`research.md` §6, touch-gesture feel is validated here rather than by
automated test.

## Prerequisites

- Repository checked out with this feature implemented.
- A desktop browser with DevTools device emulation (for touch simulation),
  and ideally a real phone browser for final confirmation.

## Setup

```bash
npm install
npm run dev
```

## Automated checks (fast feedback, run before manual validation)

```bash
npm run test   # Vitest: mode-detection logic, joystick axis math
```

All tests MUST pass before proceeding.

## Manual validation scenarios

### 1. Auto-detection on load (US1, SC-001/SC-002)

1. Open the dev server URL in a desktop browser (no device emulation).
   **Expect**: no on-screen touch controls appear; keyboard play works
   exactly as in 001-core-vehicle-loop.
2. Open DevTools, enable device emulation (touch-capable phone profile),
   reload. **Expect**: on-screen touch controls (two joysticks, Drift and
   Turbo buttons) appear automatically, no settings step.

### 2. Runtime override on ambiguous/hybrid behavior (US1, SC-005)

1. Starting in keyboard mode (Scenario 1), touch/click the canvas using
   DevTools' touch simulation. **Expect**: touch controls appear (mode
   switched to `touch`).
2. Starting in touch mode (Scenario 1, emulation on), press a keyboard
   movement key (e.g. `W`). **Expect**: touch controls disappear and
   keyboard control resumes (mode switched to `keyboard`).
3. In keyboard mode, click with the mouse (not touch simulation).
   **Expect**: mode stays `keyboard` — a plain mouse click must never
   trigger a switch to touch mode.

### 3. Touch drive/steer (US2, SC-004 parity with 001)

1. In touch mode, drag the left joystick forward. **Expect**: vehicle
   accelerates forward proportionally to drag distance.
2. Drag it left/right. **Expect**: vehicle steers accordingly.
3. Release it. **Expect**: joystick recenters and the vehicle's
   throttle/steer input returns to neutral immediately.
4. Confirm a right joystick is visible and draggable but has no effect on
   the vehicle.

### 4. Touch drift and turbo (US3, SC-004)

1. Build up speed, then hold the on-screen Drift button while dragging the
   left joystick into a turn. **Expect**: same traction-loss behavior as
   001's keyboard Space drift.
2. Release the Drift button. **Expect**: normal traction returns.
3. Tap the Turbo button. **Expect**: same boost-then-cooldown behavior as
   001's keyboard Shift turbo; rapid re-taps during boost/cooldown have no
   extra effect.

### 5. Landscape-only orientation gate (US4, SC-003)

1. In touch mode (device emulation), rotate the emulated device to
   portrait. **Expect**: gameplay is blocked, a full-screen rotate-to-
   landscape prompt appears, and no vehicle motion occurs even if a
   joystick is dragged.
2. Rotate back to landscape. **Expect**: the prompt disappears and
   gameplay resumes automatically within ~1 second, with no extra tap
   needed.
3. Confirm the vehicle's state (position, drift/turbo status) picks up
   from where it was, not reset.
4. In keyboard mode, resize the browser window to be taller than wide.
   **Expect**: no rotate prompt appears.

### 6. Joystick release edge cases (Edge Cases, FR-011)

1. Drag a joystick, then drag the pointer off the edge of the screen /
   browser viewport before releasing. **Expect**: the joystick still
   returns to neutral (via `pointercancel` or the eventual `pointerup`),
   never left "stuck" pushed in a direction.

## Done criteria

All scenarios above behave as expected, and `npm run test` passes. This
satisfies `spec.md`'s Success Criteria SC-001 through SC-005.
