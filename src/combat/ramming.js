import { RAM } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

/**
 * Pure: ramming damage formula (spec.md, Principle II) — damage dealt to
 * the OTHER vehicle, from THIS vehicle's own speed and mass at the moment
 * of impact. Symmetric: called once per vehicle in a colliding pair.
 */
export function computeRamDamage(speed, mass, k = RAM.k) {
  return Math.abs(speed) * mass * k;
}

function speedOf(vehicle) {
  const v = vehicle.chassisBody.linvel();
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Collision-event handler (research.md §1) registered with main.js's
 * EventQueue drain. Fires only on a new contact (`started === true`)
 * between two vehicles resolved via the collider-handle registry; applies
 * symmetric damage, each proportional to that vehicle's own speed*mass —
 * never "whoever hit."
 */
export function handleRammingCollision(handle1, handle2, started) {
  if (!started) return;

  const vehicleA = getVehicleByColliderHandle(handle1);
  const vehicleB = getVehicleByColliderHandle(handle2);
  if (!vehicleA || !vehicleB) return; // not a vehicle-vehicle collision

  const damageToB = computeRamDamage(speedOf(vehicleA), vehicleA.archetype.mass);
  const damageToA = computeRamDamage(speedOf(vehicleB), vehicleB.archetype.mass);

  applyDamage(vehicleB, damageToB);
  applyDamage(vehicleA, damageToA);
}
