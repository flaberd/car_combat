// Turbo (data-model.md TurboState): a rechargeable boost meter, not a
// fixed-duration ability. Boosting requires the turbo input held down AND
// remaining charge; releasing the input stops the boost immediately and
// the meter starts recharging right away. While held with an empty meter,
// nothing happens (no boost, no recharge) until the button is released —
// recharging only happens between presses, so a full hold-to-drain never
// flickers between draining and recharging on the same frame.
//
// Charge drains at `1 / turboBoostDuration` per second while boosting and
// refills at `1 / turboCooldown` per second while released, so those two
// per-archetype tunables now read as "seconds of continuous boost from a
// full charge" and "seconds to fully recharge from empty" respectively.

export function createTurboState() {
  return { charge: 1, boosting: false };
}

/**
 * Mutates and returns `turbo` in place. `turboHeld` is the live (held, not
 * edge-triggered) turbo input state — see input/inputState.js. `durations`
 * is `{ turboBoostDuration, turboCooldown }` from the vehicle's archetype.
 */
export function updateTurboState(turbo, turboHeld, dt, durations) {
  turbo.boosting = turboHeld && turbo.charge > 0;
  if (turbo.boosting) {
    turbo.charge = Math.max(0, turbo.charge - dt / durations.turboBoostDuration);
  } else if (!turboHeld) {
    turbo.charge = Math.min(1, turbo.charge + dt / durations.turboCooldown);
  }
  return turbo;
}
