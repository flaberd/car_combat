import { createKeyboardInput, isBoundKeyCode } from "./inputState.js";
import { createTouchInput } from "./touchInput.js";
import { createOrientationGate, computeBlocked } from "./orientationGate.js";

const TOUCH_PRIMARY_QUERY = "(pointer: coarse) and (hover: none)";

/** Pure: initial mode from whether the device's primary pointer is touch-like (research.md §1). */
export function decideInitialMode(isTouchPrimary) {
  return isTouchPrimary ? "touch" : "keyboard";
}

/**
 * Pure: runtime override decision (research.md §2, FR-009). `event` is
 * `{ type: 'pointerdown', pointerType }` or `{ type: 'keydown', code }`.
 * A mouse pointerdown never changes mode (hybrid-device Edge Case).
 */
export function decideOverride(currentMode, event) {
  if (event.type === "pointerdown" && event.pointerType === "touch") {
    return "touch";
  }
  if (event.type === "keydown" && isBoundKeyCode(event.code)) {
    return "keyboard";
  }
  return currentMode;
}

/**
 * Owns input-method detection/switching (data-model.md InputMethod) and the
 * landscape orientation gate (data-model.md OrientationGate), exposing the
 * same `read()`/`isGameplayBlocked()` shape `main.js` already calls.
 * `onModeChange(mode)` and `onBlockedChange(blocked)` each fire once
 * immediately with the initial value and again on every change, so callers
 * can sync DOM visibility (FR-006, FR-008).
 */
export function createInputController(
  window,
  { onModeChange, onBlockedChange } = {},
) {
  const keyboardInput = createKeyboardInput(window);
  const touchInput = createTouchInput(window.document);

  const mediaQuery = window.matchMedia(TOUCH_PRIMARY_QUERY);
  let mode = decideInitialMode(mediaQuery.matches);
  let blocked; // undefined so the first updateBlocked() call always fires onBlockedChange once

  function updateBlocked() {
    const nextBlocked = computeBlocked(mode, orientationGate.isPortrait);
    if (nextBlocked === blocked) return;
    blocked = nextBlocked;
    onBlockedChange?.(blocked);
  }

  const orientationGate = createOrientationGate(window, {
    onChange: updateBlocked,
  });

  function setMode(nextMode) {
    if (nextMode === mode) return;
    mode = nextMode;
    onModeChange?.(mode);
    updateBlocked();
  }

  const onPointerDown = (event) => {
    setMode(
      decideOverride(mode, {
        type: "pointerdown",
        pointerType: event.pointerType,
      }),
    );
  };
  const onKeyDown = (event) => {
    setMode(decideOverride(mode, { type: "keydown", code: event.code }));
  };
  const onMediaQueryChange = (event) => {
    setMode(decideInitialMode(event.matches));
  };

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", onKeyDown);
  mediaQuery.addEventListener("change", onMediaQueryChange);

  onModeChange?.(mode);
  updateBlocked();

  return {
    getMode() {
      return mode;
    },
    read() {
      return mode === "touch" ? touchInput.read() : keyboardInput.read();
    },
    isGameplayBlocked() {
      return blocked;
    },
    dispose() {
      keyboardInput.dispose();
      touchInput.dispose();
      orientationGate.dispose();
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      mediaQuery.removeEventListener("change", onMediaQueryChange);
    },
  };
}
