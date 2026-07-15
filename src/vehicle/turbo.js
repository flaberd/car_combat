import { TURBO } from "../config/tuning.js";

// TurboState state machine (data-model.md TurboState, FR-005/FR-006):
// ready --(turbo pressed)--> boosting --(duration elapsed)--> cooling_down
// --(cooldown elapsed)--> ready. No direct boosting/cooling_down -> boosting
// shortcut: reactivation always waits for the full cooldown.

export function createTurboState() {
  return { status: "ready", boostElapsed: 0, cooldownElapsed: 0 };
}

/** Mutates and returns `turbo` in place. `turboPressed` must be edge-triggered (see input/inputState.js). */
export function updateTurboState(turbo, turboPressed, dt) {
  switch (turbo.status) {
    case "ready":
      if (turboPressed) {
        turbo.status = "boosting";
        turbo.boostElapsed = 0;
      }
      break;
    case "boosting":
      turbo.boostElapsed += dt;
      if (turbo.boostElapsed >= TURBO.boostDuration) {
        turbo.status = "cooling_down";
        turbo.cooldownElapsed = 0;
      }
      break;
    case "cooling_down":
      turbo.cooldownElapsed += dt;
      if (turbo.cooldownElapsed >= TURBO.cooldownDuration) {
        turbo.status = "ready";
      }
      break;
    default:
      break;
  }
  return turbo;
}
