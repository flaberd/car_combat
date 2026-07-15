const DEFAULT_MAX_RADIUS = 44;

/**
 * Pure: drag offset (in pixels, from the joystick's center) -> normalized,
 * clamped axis output (data-model.md VirtualJoystick.axis). Screen Y grows
 * downward, but a forward drag (up) must produce a positive `y` to match
 * InputState.moveAxis's convention (see src/input/inputState.js), so `y`
 * is inverted here.
 */
export function computeJoystickAxis(dx, dy, maxRadius = DEFAULT_MAX_RADIUS) {
  if (maxRadius <= 0) return { x: 0, y: 0 };

  const distance = Math.hypot(dx, dy);
  const clampedDistance = Math.min(distance, maxRadius);
  const angle = Math.atan2(dy, dx);
  const clampedDx = Math.cos(angle) * clampedDistance;
  const clampedDy = Math.sin(angle) * clampedDistance;

  return {
    // `|| 0` normalizes -0 to 0 (e.g. exactly-zero drag) for predictable equality.
    x: clampedDx / maxRadius || 0,
    y: (-clampedDy / maxRadius) || 0,
  };
}

/**
 * Stateful Pointer Events wrapper (research.md §3, FR-011): tracks a single
 * `pointerId` per joystick so left/right joysticks and touch buttons can
 * all be active concurrently. `axis` is `{0,0}` whenever untouched, reset
 * on release or cancel so a dropped touch never leaves it "stuck".
 */
export function createVirtualJoystick(
  rootEl,
  knobEl,
  { maxRadius = DEFAULT_MAX_RADIUS } = {},
) {
  let activePointerId = null;
  let originX = 0;
  let originY = 0;
  const axis = { x: 0, y: 0 };

  function reset() {
    activePointerId = null;
    axis.x = 0;
    axis.y = 0;
    knobEl.style.transform = "translate(0px, 0px)";
  }

  function updateFromPoint(clientX, clientY) {
    const { x, y } = computeJoystickAxis(
      clientX - originX,
      clientY - originY,
      maxRadius,
    );
    axis.x = x;
    axis.y = y;
    knobEl.style.transform = `translate(${x * maxRadius}px, ${-y * maxRadius}px)`;
  }

  function onPointerDown(event) {
    if (activePointerId !== null) return;
    activePointerId = event.pointerId;
    const rect = rootEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
    updateFromPoint(event.clientX, event.clientY);
    try {
      rootEl.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer may no longer be active (e.g. a synthetic or already-released
      // event) — capture is a nice-to-have, not required for tracking to work.
    }
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId) return;
    updateFromPoint(event.clientX, event.clientY);
  }

  function onPointerEnd(event) {
    if (event.pointerId !== activePointerId) return;
    reset();
  }

  rootEl.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerEnd);
  window.addEventListener("pointercancel", onPointerEnd);

  return {
    axis,
    dispose() {
      rootEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    },
  };
}
