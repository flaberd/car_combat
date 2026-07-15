import { DRIFT } from "../config/tuning.js";

// Traction-state logic (data-model.md Vehicle.tractionState, FR-004): drift
// is implemented as a temporary reduction of the vehicle controller's
// per-wheel side-friction stiffness (research.md §2), not a separate
// physics system.

/** Pure decision: drifting requires the input held AND enough speed to matter (Edge Cases). */
export function computeTractionState(driftInputHeld, currentSpeed) {
  if (driftInputHeld && Math.abs(currentSpeed) >= DRIFT.minSpeedForEffect) {
    return "drifting";
  }
  return "normal";
}

export function applyTractionState(controller, wheelCount, tractionState) {
  const sideFriction =
    tractionState === "drifting"
      ? DRIFT.driftSideFriction
      : DRIFT.normalSideFriction;
  for (let i = 0; i < wheelCount; i++) {
    controller.setWheelSideFrictionStiffness(i, sideFriction);
  }
}
