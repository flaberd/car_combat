# Phase 1 Data Model: Mobile Touch Controls & Input Auto-Detection

No persisted/stored data (spec Assumptions: detection runs fresh each load,
no persistence). All entities below are in-memory runtime state, extending
001-core-vehicle-loop's existing `InputState` (unchanged shape) with new
supporting state.

## InputMethod

The currently active control mode (spec Key Entities: Input Method).

| Field | Type | Notes |
|---|---|---|
| `mode` | enum: `touch` \| `keyboard` | Set by the initial media-query check (research.md §1), updated by real-event overrides (research.md §2, FR-009). |

**State transitions**:

```text
(on load) matchMedia('(pointer: coarse) and (hover: none)') --match--> touch
                                                              --no match--> keyboard

touch --(keydown matching a bound key)--> keyboard
keyboard --(pointerdown with pointerType 'touch')--> touch
```

No other transitions exist — a mouse `pointerdown` never changes `mode`
(Edge Cases: hybrid-device mouse clicks must not falsely switch to touch).

## VirtualJoystick

An on-screen touch control (spec Key Entities: Virtual Joystick). One
instance for the left (bound) joystick, one for the right (unbound,
reserved) joystick — same shape, different wiring in the input controller.

| Field | Type | Notes |
|---|---|---|
| `activePointerId` | number \| null | The Pointer Events `pointerId` currently dragging this joystick, or `null` if untouched. |
| `originX`, `originY` | number | Screen coordinates of the joystick's center (where the touch started, or a fixed on-screen anchor). |
| `maxRadius` | number | Maximum drag distance from origin, in pixels; drag distance is clamped to this. |
| `axis` | `{ x: number, y: number }`, each in `[-1, 1]` | Normalized output: drag offset divided by `maxRadius`, clamped. `{0,0}` when `activePointerId` is `null`. |

**Validation / invariants**:
- `axis` MUST be `{0, 0}` whenever `activePointerId` is `null` (FR-011: a
  released or interrupted joystick returns to neutral — covers `pointerup`
  and `pointercancel` identically).
- The left joystick's `axis` feeds `InputState.moveAxis` directly; the right
  joystick's `axis` is computed but intentionally not read by anything in
  this feature (FR-003) — it exists so a future feature can read it without
  reworking this module.

## TouchButton

An on-screen tappable control (spec Key Entities: Touch Button). One
instance each for Drift and Turbo.

| Field | Type | Notes |
|---|---|---|
| `activePointerId` | number \| null | The pointer currently pressing this button, or `null`. |
| `pressed` | boolean | `true` while `activePointerId` is non-null. |

**Mapping to InputState** (mirrors keyboard's own edge-triggering rules from
001's `src/input/inputState.js`):
- Drift button: `InputState.drift = pressed` (held, like keyboard Space).
- Turbo button: `InputState.turbo` is edge-triggered `true` only on the
  frame `pressed` transitions from `false` to `true` (like keyboard Shift),
  reusing the same up-to-down edge pattern 001 already established.

## OrientationGate

Tracks whether gameplay is currently blocked pending device rotation (spec
Key Entities: Orientation Gate). Only meaningful while `InputMethod.mode`
is `touch` (FR-010).

| Field | Type | Notes |
|---|---|---|
| `isPortrait` | boolean | Result of `matchMedia('(orientation: portrait)').matches`, kept live via its `change` event. |
| `blocked` | boolean | `true` when `mode === 'touch' && isPortrait`; drives whether the rotate-device prompt is shown and whether the game loop's physics/input step runs this frame. |

**Validation / invariants**:
- `blocked` MUST always be `false` while `mode === 'keyboard'`, regardless of
  `isPortrait` (FR-010; Edge Cases: no rotate prompt on a narrow desktop
  window).
- While `blocked` is `true`, the game loop MUST skip `stepVehicleControl`
  and `world.step()` for that frame (pause, not reset) — vehicle/physics
  state is simply left untouched until `blocked` returns to `false` (Edge
  Cases: mid-drift/turbo state is preserved across a block/resume cycle).
