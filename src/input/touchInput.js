import { createVirtualJoystick } from "./virtualJoystick.js";

/**
 * Pointer-Events-tracked on-screen button (data-model.md TouchButton). One
 * pointer at a time; `pressed` is live (for Drift's held behavior),
 * `consumeEdge()` returns true only once per press (for Turbo's
 * edge-triggered behavior, mirroring keyboard's turbo edge logic in
 * src/input/inputState.js) and resets after being read.
 */
function createTouchButton(rootEl) {
  let activePointerId = null;
  let pressed = false;
  let justPressed = false;

  function onPointerDown(event) {
    if (activePointerId !== null) return;
    activePointerId = event.pointerId;
    pressed = true;
    justPressed = true;
    rootEl.classList.add("pressed");
    try {
      rootEl.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer may no longer be active (e.g. a synthetic or already-released
      // event) — capture is a nice-to-have, not required for tracking to work.
    }
  }

  function onPointerEnd(event) {
    if (event.pointerId !== activePointerId) return;
    activePointerId = null;
    pressed = false;
    rootEl.classList.remove("pressed");
  }

  rootEl.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerEnd);
  window.addEventListener("pointercancel", onPointerEnd);

  return {
    get pressed() {
      return pressed;
    },
    consumeEdge() {
      const wasJustPressed = justPressed;
      justPressed = false;
      return wasJustPressed;
    },
    dispose() {
      rootEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    },
  };
}

/**
 * Touch input source (FR-002-FR-005): produces the same InputState shape
 * as keyboard (src/input/inputState.js). The left joystick drives
 * moveAxis; the right joystick is wired up but its axis is intentionally
 * not read into InputState.aimAxis (stays {0,0}), reserved for a future
 * feature per FR-003. Drift is held (matches keyboard Space); Turbo is
 * edge-triggered on press (matches keyboard Shift).
 */
export function createTouchInput(document) {
  const leftJoystick = createVirtualJoystick(
    document.getElementById("joystick-left"),
    document.getElementById("joystick-left").querySelector(".joystick-knob"),
  );
  const rightJoystick = createVirtualJoystick(
    document.getElementById("joystick-right"),
    document.getElementById("joystick-right").querySelector(".joystick-knob"),
  );
  const driftButton = createTouchButton(
    document.getElementById("touch-button-drift"),
  );
  const turboButton = createTouchButton(
    document.getElementById("touch-button-turbo"),
  );

  return {
    leftJoystick,
    rightJoystick,
    driftButton,
    turboButton,
    read() {
      return {
        moveAxis: { x: leftJoystick.axis.x, y: leftJoystick.axis.y },
        aimAxis: { x: 0, y: 0 },
        drift: driftButton.pressed,
        turbo: turboButton.consumeEdge(),
      };
    },
    dispose() {
      leftJoystick.dispose();
      rightJoystick.dispose();
      driftButton.dispose();
      turboButton.dispose();
    },
  };
}
