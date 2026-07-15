// TurboState state machine (data-model.md TurboState, FR-005/FR-006):
// ready --(turbo pressed)--> boosting --(duration elapsed)--> cooling_down
// --(cooldown elapsed)--> ready. No direct boosting/cooling_down -> boosting
// shortcut: reactivation always waits for the full cooldown.
//
// Boost/cooldown durations are per-archetype since 002-combat-system
// (specs/002-combat-system/data-model.md ArchetypeConfig), passed in rather
// than imported, so this module stays archetype-agnostic.

export function createTurboState() {
  return { status: "ready", boostElapsed: 0, cooldownElapsed: 0 };
}

/**
 * Mutates and returns `turbo` in place. `turboPressed` must be
 * edge-triggered (see input/inputState.js). `durations` is
 * `{ turboBoostDuration, turboCooldown }` from the vehicle's archetype.
 */
export function updateTurboState(turbo, turboPressed, dt, durations) {
  switch (turbo.status) {
    case "ready":
      if (turboPressed) {
        turbo.status = "boosting";
        turbo.boostElapsed = 0;
      }
      break;
    case "boosting":
      turbo.boostElapsed += dt;
      if (turbo.boostElapsed >= durations.turboBoostDuration) {
        turbo.status = "cooling_down";
        turbo.cooldownElapsed = 0;
      }
      break;
    case "cooling_down":
      turbo.cooldownElapsed += dt;
      if (turbo.cooldownElapsed >= durations.turboCooldown) {
        turbo.status = "ready";
      }
      break;
    default:
      break;
  }
  return turbo;
}
