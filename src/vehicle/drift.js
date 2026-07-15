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

/**
 * `extraFrictionMultiplier` (default 1, no effect) lets other systems —
 * currently 002-combat-system's oil slick — further scale the chosen
 * friction value without inventing a parallel friction mechanism
 * (research.md §6).
 */
export function applyTractionState(
  controller,
  wheelCount,
  tractionState,
  extraFrictionMultiplier = 1,
) {
  const baseFriction =
    tractionState === "drifting"
      ? DRIFT.driftSideFriction
      : DRIFT.normalSideFriction;
  const sideFriction = baseFriction * extraFrictionMultiplier;
  for (let i = 0; i < wheelCount; i++) {
    controller.setWheelSideFrictionStiffness(i, sideFriction);
  }
}
