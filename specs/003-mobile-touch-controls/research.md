# Phase 0 Research: Mobile Touch Controls & Input Auto-Detection

## 1. Detecting the primary input method

**Decision**: Use `window.matchMedia('(pointer: coarse) and (hover: none)')` on load
to decide the initial mode: match → `touch`, no match → `keyboard`. Listen for
the media query's `change` event too (covers devices that can dock/undock a
keyboard or mouse without a full reload, though this is a secondary signal —
FR-009's real-event override is the primary mechanism for correcting a wrong
guess).

**Rationale**: `pointer`/`hover` (not `any-pointer`/`any-hover`) report the
*primary* input mechanism as the browser understands it — which is exactly
the touchscreen-laptop-vs-tablet distinction the spec's Assumptions call for.
`any-pointer: coarse` would be true on almost any laptop with a touchscreen
even though its primary interaction is mouse/trackpad, which is the wrong
signal here.

**Alternatives considered**: User-agent sniffing — rejected, unreliable and
explicitly discouraged; doesn't distinguish primary-vs-secondary input either.
`ontouchstart in window` alone — rejected, only proves touch *capability*,
which is true on many non-touch-primary laptops today.

## 2. Runtime override (FR-009)

**Decision**: Keep the media-query result as the initial mode, but flip modes
immediately on the first real, unambiguous signal to the contrary:
- Any `pointerdown` event with `event.pointerType === 'touch'` on the game
  canvas → switch to `touch` mode (if not already).
- Any `keydown` matching one of the existing movement/drift/turbo key
  bindings (`src/input/inputState.js` `KEY_BINDINGS`) → switch to `keyboard`
  mode (if not already).

Mouse-only events (`pointerType === 'mouse'`) never trigger a switch to touch
mode (spec Edge Cases: a hybrid device's mouse click must not falsely switch
modes).

**Rationale**: This directly satisfies FR-009 with signals that are already
unambiguous by construction — a genuine touch contact or a genuine bound-key
press — with no heuristic guessing beyond the initial media-query default.

**Alternatives considered**: Re-running the media query on a timer — rejected,
doesn't observe actual behavior, just re-samples the same imperfect signal.

## 3. Virtual joystick input mechanism

**Decision**: Implement virtual joysticks and buttons with the Pointer Events
API (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`), each control
tracking its own `pointerId` so the two joysticks and two buttons can all be
active concurrently (multi-touch) without interfering with each other. Each
joystick's root element gets `touch-action: none` in CSS so the browser
doesn't intercept the gesture as a page scroll/zoom.

**Rationale**: Pointer Events unify mouse/touch/pen handling behind one API
and natively support the multi-touch case this feature needs (drive +
drift/turbo simultaneously). This also means the same joystick code
technically also responds to a mouse drag, which is harmless (it just never
runs in `keyboard` mode since the touch UI isn't rendered then).

**Alternatives considered**: Raw `touchstart`/`touchmove`/`touchend` — rejected,
requires manually managing `event.changedTouches` identifiers to achieve the
same multi-touch tracking Pointer Events give for free, with no benefit here.

## 4. Orientation detection (FR-007/FR-008)

**Decision**: Use `window.matchMedia('(orientation: portrait)')` (with a
`change` listener) as the primary signal for the orientation gate, rather
than the Screen Orientation API's `lock()`.

**Rationale**: `orientation: portrait/landscape` is a simple, universally
supported comparison of viewport width vs. height and fires reliably on
rotation. The Screen Orientation API's `screen.orientation.lock()` (which
would force landscape rather than just detect it) requires fullscreen mode
and has inconsistent support (notably unsupported on iOS Safari), which
would make the feature unreliable on a meaningful share of phones. A
detect-and-prompt approach (spec FR-007/FR-008) works everywhere and matches
what the spec actually asks for — a prompt, not a forced lock.

**Alternatives considered**: `screen.orientation.lock('landscape')` —
rejected as the primary mechanism due to inconsistent/no support on iOS
Safari; `window.orientation` (deprecated, non-standard) — rejected in favor
of the standard `matchMedia` approach.

## 5. Integrating with the existing InputState architecture (001)

**Decision**: Introduce an `inputController` module that owns mode detection
(§1–2) and exposes a single `read()` — the same shape `main.js` already calls
on `keyboardInput` today — internally delegating to either the existing
`createKeyboardInput` (unchanged) or a new `createTouchInput` (joysticks +
buttons, §3) depending on the current mode. `main.js` changes minimally: it
calls the controller's `read()` once per frame exactly as it calls
`keyboardInput.read()` today, and additionally asks the controller each frame
whether gameplay is currently gated by orientation (§4) before running the
physics/control step.

**Rationale**: This is the smallest change that satisfies FR-001–FR-009
without touching `src/vehicle/*.js` or `src/physics/*.js` at all — those
modules only ever consume an `InputState` shape that hasn't changed
(`moveAxis`, `aimAxis`, `drift`, `turbo`), exactly per the constitution's
"prefer an abstracted input-action layer" guidance that 001 already
established.

**Alternatives considered**: Rewriting `main.js`'s loop to branch on mode
directly — rejected, spreads mode-switching logic across the game loop
instead of keeping it behind one module boundary.

## 6. Testing approach

**Decision**: Follow 001's precedent (research.md §5 there) — Vitest unit
tests for pure logic only: the mode-decision function (given a fake
`matchMedia`/event input, does it pick the right mode?) and the joystick
math (drag offset → clamped, normalized axis output). Touch-gesture feel,
orientation-prompt UX, and the actual on-device experience are validated
manually per this feature's `quickstart.md`, consistent with 001's existing
"physics/UX feel is a manual-playtest concern" decision.

**Rationale**: Consistency with the established project testing philosophy;
DOM/gesture-level behavior in a headless test runner would be a low-value,
high-maintenance simulation of something better verified by hand (or, during
this implementation, via a headless-browser Pointer Event simulation as was
done for 001's verification pass).

**Alternatives considered**: jsdom-based simulated touch-event tests —
rejected as brittle and not aligned with the project's existing approach to
feel-dependent UI.

## 7. Start Gate: forcing landscape when OS auto-rotate is off (added post-implementation, User Story 5)

**Decision**: Add a Start button shown before any gameplay. On tap, if the
active input mode is `touch`: call `document.documentElement.requestFullscreen()`,
then — only if that resolves — attempt `screen.orientation.lock('landscape')`.
Both calls are wrapped so any rejection/exception is swallowed; the game
starts regardless of whether either succeeded. In `keyboard` mode, Start
just starts the game — no fullscreen/orientation-lock calls are made.

**Rationale**: §4 already established that `matchMedia('(orientation: ...)')`
is a passive signal — it only reflects what the OS has actually done to the
viewport. If a player has their OS's auto-rotate lock switched on (rotation
disabled), the OS never reflows the browser on physical rotation, so that
signal never changes and User Story 4's prompt can never resolve — this is
the real gap the Start Gate closes. `screen.orientation.lock()` requires
both a secure context and (on most browsers) fullscreen first, which is why
fullscreen is requested first, in sequence, inside the same
user-gesture-triggered handler (both APIs require a user gesture; chaining
them inside one tap handler keeps both calls within that gesture window).
Locking forces the *rendered* orientation on supporting browsers regardless
of the OS-level rotation-lock switch — this is the actual mechanism that
fixes the bug, not a UX nicety.

**Fallback behavior**: `screen.orientation.lock()` throws/rejects on
browsers that don't implement it — most notably iOS Safari, consistent with
§4's original finding. On those browsers, fullscreen may still succeed
(iOS Safari supports element Fullscreen as of recent versions) but
orientation stays whatever the OS provides, so User Story 4's existing
`matchMedia`-based rotate-prompt gate remains the operative fallback exactly
as before this story — this story does not remove or replace it, only adds
a stronger first attempt ahead of it.

**Alternatives considered**: Requesting orientation lock without fullscreen
first — rejected, most browsers reject `orientation.lock()` outside
fullscreen (Chrome requires it; this matches §4's original research).
Auto-requesting fullscreen/lock on page load without a Start button —
rejected outright: both `requestFullscreen()` and `orientation.lock()`
require an active user gesture, so a tap is structurally necessary, not
just good practice — this also naturally satisfies FR-012 (no gameplay
visible until Start).
