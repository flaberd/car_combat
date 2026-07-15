// Keyboard -> InputState mapping (data-model.md InputState; FR-002/003/004/005/007).
// `aimAxis` is exposed now but stays {0,0} — weapons fire in the vehicle's
// facing direction (002-combat-system research.md §9), no independent aim.

const KEY_BINDINGS = {
  moveForward: ["KeyW", "ArrowUp"],
  moveBackward: ["KeyS", "ArrowDown"],
  steerLeft: ["KeyA", "ArrowLeft"],
  steerRight: ["KeyD", "ArrowRight"],
  drift: ["Space"],
  turbo: ["ShiftLeft", "ShiftRight"],
  fire: ["KeyF"],
  usePickup: ["KeyE"],
};

function isAnyDown(keysDown, codes) {
  return codes.some((code) => keysDown.has(code));
}

const ALL_BOUND_KEY_CODES = new Set(Object.values(KEY_BINDINGS).flat());

/** True if `code` is one of the movement/drift/turbo key bindings above. */
export function isBoundKeyCode(code) {
  return ALL_BOUND_KEY_CODES.has(code);
}

/**
 * Pure mapping from a set of currently-held key codes to this frame's
 * InputState. `turbo` is edge-triggered (true only on the frame the turbo
 * key transitions from up to down), so holding it doesn't repeatedly
 * re-trigger once TurboState returns to `ready` (see data-model.md
 * TurboState, FR-006).
 */
export function mapKeysToInputState(keysDown, previousTurboKeyDown) {
  const forward = isAnyDown(keysDown, KEY_BINDINGS.moveForward) ? 1 : 0;
  const backward = isAnyDown(keysDown, KEY_BINDINGS.moveBackward) ? 1 : 0;
  const left = isAnyDown(keysDown, KEY_BINDINGS.steerLeft) ? 1 : 0;
  const right = isAnyDown(keysDown, KEY_BINDINGS.steerRight) ? 1 : 0;

  const turboKeyDown = isAnyDown(keysDown, KEY_BINDINGS.turbo);
  const turboPressed = turboKeyDown && !previousTurboKeyDown;

  const inputState = {
    moveAxis: { x: right - left, y: forward - backward },
    aimAxis: { x: 0, y: 0 },
    drift: isAnyDown(keysDown, KEY_BINDINGS.drift),
    turbo: turboPressed,
    fire: isAnyDown(keysDown, KEY_BINDINGS.fire),
    usePickup: isAnyDown(keysDown, KEY_BINDINGS.usePickup),
  };

  return { inputState, turboKeyDown };
}

/** Stateful keyboard source: tracks held keys via DOM events. */
export function createKeyboardInput(target = window) {
  const keysDown = new Set();
  let previousTurboKeyDown = false;

  const onKeyDown = (event) => keysDown.add(event.code);
  const onKeyUp = (event) => keysDown.delete(event.code);
  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);

  return {
    read() {
      const { inputState, turboKeyDown } = mapKeysToInputState(
        keysDown,
        previousTurboKeyDown,
      );
      previousTurboKeyDown = turboKeyDown;
      return inputState;
    },
    dispose() {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
    },
  };
}
