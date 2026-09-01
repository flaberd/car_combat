# Mobile Touch Controls

## Purpose

Lets the game be played from a phone browser with the correct control
scheme enabled automatically, in addition to desktop keyboard — no manual
toggle. Extends [Core Vehicle Loop](core-vehicle-loop.md)'s input layer
without changing `InputState`'s shape.

---

## Scope

Input-method auto-detection, virtual joysticks, on-screen drift/turbo
buttons, the landscape-only orientation gate, and the fullscreen/Start
gate. Does not cover gamepad support, native app packaging, or
combat/aim behavior on the (currently unbound) right joystick — all
explicit non-goals, see
[MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md).

---

## Player Experience

- On load, the game detects whether the primary input is touch or
  keyboard/mouse (via `pointer: coarse` + `hover: none` media features,
  not merely touch support) and shows the matching controls with no
  settings step.
- A real input event that contradicts the active mode switches it at
  runtime: an actual touch event while in keyboard mode switches to touch;
  a bound movement key while in touch mode switches to keyboard. A mouse
  click alone never triggers a switch to touch (hybrid-device safety).
- **Touch controls**: left virtual joystick drives `moveAxis`
  (drive + steer); a right virtual joystick is visible and touchable but
  intentionally unbound (reserved for a future aim/fire feature); Drift and
  Turbo are on-screen buttons mirroring the keyboard's Space/Shift.
- **Start gate**: a Start button is shown before any gameplay is visible.
  On touch devices, tapping it requests fullscreen and attempts to
  programmatically lock orientation to landscape — both best-effort; the
  game starts regardless of whether either succeeds (needed because many
  players have OS-level auto-rotate disabled, so a physical rotation alone
  never triggers the orientation gate below). On keyboard devices, Start
  just starts the game.
- **Orientation gate**: while in touch mode, portrait orientation blocks
  gameplay (pauses physics/input) and shows a full-screen rotate-to-landscape
  prompt; it clears automatically once the device is landscape. This gate
  never applies in keyboard mode, regardless of window aspect ratio.

---

## Design Rules

- Touch/keyboard detection is a CSS media-query check
  (`pointer: coarse` and `hover: none`), not a touch-support check — this
  correctly defaults a touchscreen laptop (fine pointer, hover-capable) to
  keyboard, and a tablet (touch-primary even with a paired keyboard) to
  touch.
- A released or interrupted joystick touch (including `pointercancel`, e.g.
  an incoming-call overlay) returns that joystick to `{0,0}` rather than
  sticking at its last position.
- Turbo's on-screen button is held, same as Drift's (both match their
  keyboard equivalents, Shift and Space) — turbo boosts only while pressed,
  see [Core Vehicle Loop](core-vehicle-loop.md).
- No persistence: input-method and orientation state are re-detected fresh
  on every page load.

---

## Edge Cases and Constraints

- If fullscreen/orientation-lock is rejected or later exited (e.g. a system
  back gesture), the game stays playable — the orientation gate remains the
  fallback if the display ends up portrait.
- On browsers without programmatic orientation locking (e.g. iOS
  Safari-class), Start still enters fullscreen and starts the game; the
  player must physically rotate with OS auto-rotate enabled, falling back
  to the orientation gate.
- Mid-drift/mid-turbo vehicle state is preserved across an orientation-gate
  block/resume cycle — gameplay pauses, it does not reset.
- Desktop/keyboard behavior is unaffected by any of the above — no touch
  controls, no orientation gate, no fullscreen prompt.

---

## Implementation Entry Points

Systems

- `src/input/touchInput.js` — touch-mode detection, event wiring
- `src/input/virtualJoystick.js` — left/right joystick tracking
- `src/input/orientationGate.js` — portrait-block + rotate prompt
- `src/input/startGate.js` — fullscreen/orientation-lock on first tap
- `src/ui/touchControls.css` — on-screen control layout

Tests

- `tests/unit/virtualJoystick.test.js`

---

## Related Documents

- [Core Vehicle Loop](core-vehicle-loop.md)
- [MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md)
