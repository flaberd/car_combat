import { RAM } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

/**
 * Pure: ramming damage formula (spec.md, Principle II) — damage dealt to
 * the OTHER vehicle, from THIS vehicle's own speed and mass at the moment
 * of impact. Symmetric: called once per vehicle in a colliding pair. Only
 * speed above `minImpactSpeed` counts (constitution Principle II's
 * "minimum-impact threshold"), so a slow bump deals no damage and the
 * ramp-in above the threshold is smooth rather than a sudden jump.
 */
export function computeRamDamage(speed, mass, k = RAM.k, minImpactSpeed = RAM.minImpactSpeed) {
  const excessSpeed = Math.max(0, Math.abs(speed) - minImpactSpeed);
  return excessSpeed * mass * k;
}

/**
 * Collision-event handler (research.md §1) registered with main.js's
 * EventQueue drain. Fires on a new contact (`started === true`) between
 * two vehicles resolved via the collider-handle registry; applies
 * symmetric damage, each proportional to that vehicle's own speed*mass —
 * never "whoever hit."
 *
 * Two guards keep a single ram from being counted many times over: (1)
 * damage uses `vehicle.approachSpeed`, a snapshot taken before world.step()
 * resolves the collision impulse, not live post-impact velocity — a
 * vehicle that was nearly stationary shouldn't register a "hit" just
 * because the collision itself bounced it; (2) each vehicle has a brief
 * ramCooldownRemaining (RAM.cooldown) so bodies jittering in and out of
 * contact for a few physics steps — Rapier can re-fire `started` several
 * times for what is visually one sustained ram — don't re-deal damage
 * every time, which previously chewed through a vehicle's HP (and froze
 * its controls via elimination) from what looked like a single, moderate
 * bump.
 */
export function handleRammingCollision(handle1, handle2, started) {
  if (!started) return;

  const vehicleA = getVehicleByColliderHandle(handle1);
  const vehicleB = getVehicleByColliderHandle(handle2);
  if (!vehicleA || !vehicleB) return; // not a vehicle-vehicle collision

  if (vehicleB.ramCooldownRemaining <= 0) {
    applyDamage(vehicleB, computeRamDamage(vehicleA.approachSpeed, vehicleA.archetype.mass));
    vehicleB.ramCooldownRemaining = RAM.cooldown;
  }
  if (vehicleA.ramCooldownRemaining <= 0) {
    applyDamage(vehicleA, computeRamDamage(vehicleB.approachSpeed, vehicleB.archetype.mass));
    vehicleA.ramCooldownRemaining = RAM.cooldown;
  }
}
