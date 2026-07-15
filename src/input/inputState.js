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
  switchWeaponPrev: ["KeyQ"],
  switchWeaponNext: ["KeyR"],
};

// Held-key bindings whose InputState field is edge-triggered (true only on
// the frame the key transitions from up to down) rather than live-held,
// mirroring each other so a single tracked "was down last frame" set
// covers turbo and weapon-switching alike.
const EDGE_TRIGGERED_BINDINGS = ["turbo", "switchWeaponPrev", "switchWeaponNext"];

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
 * InputState. `turbo`/`switchWeaponPrev`/`switchWeaponNext` are
 * edge-triggered (true only on the frame their key transitions from up to
 * down) so holding one doesn't repeatedly re-trigger — turbo shouldn't
 * re-fire once TurboState returns to `ready` (data-model.md TurboState,
 * FR-006), and weapon-switch shouldn't cycle every frame the key is held.
 * `previousEdgeKeysDown` is the `edgeKeysDown` object this function
 * returned last frame (`{}` on the first call).
 */
export function mapKeysToInputState(keysDown, previousEdgeKeysDown = {}) {
  const forward = isAnyDown(keysDown, KEY_BINDINGS.moveForward) ? 1 : 0;
  const backward = isAnyDown(keysDown, KEY_BINDINGS.moveBackward) ? 1 : 0;
  const left = isAnyDown(keysDown, KEY_BINDINGS.steerLeft) ? 1 : 0;
  const right = isAnyDown(keysDown, KEY_BINDINGS.steerRight) ? 1 : 0;

  const edgeKeysDown = {};
  const edgeTriggered = {};
  for (const binding of EDGE_TRIGGERED_BINDINGS) {
    const down = isAnyDown(keysDown, KEY_BINDINGS[binding]);
    edgeKeysDown[binding] = down;
    edgeTriggered[binding] = down && !previousEdgeKeysDown[binding];
  }

  const inputState = {
    moveAxis: { x: right - left, y: forward - backward },
    aimAxis: { x: 0, y: 0 },
    drift: isAnyDown(keysDown, KEY_BINDINGS.drift),
    turbo: edgeTriggered.turbo,
    fire: isAnyDown(keysDown, KEY_BINDINGS.fire),
    usePickup: isAnyDown(keysDown, KEY_BINDINGS.usePickup),
    switchWeaponPrev: edgeTriggered.switchWeaponPrev,
    switchWeaponNext: edgeTriggered.switchWeaponNext,
  };

  return { inputState, edgeKeysDown };
}

/** Stateful keyboard source: tracks held keys via DOM events. */
export function createKeyboardInput(target = window) {
  const keysDown = new Set();
  let previousEdgeKeysDown = {};

  const onKeyDown = (event) => keysDown.add(event.code);
  const onKeyUp = (event) => keysDown.delete(event.code);
  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);

  return {
    read() {
      const { inputState, edgeKeysDown } = mapKeysToInputState(
        keysDown,
        previousEdgeKeysDown,
      );
      previousEdgeKeysDown = edgeKeysDown;
      return inputState;
    },
    dispose() {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
    },
  };
}
