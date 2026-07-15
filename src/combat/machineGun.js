import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { WEAPONS } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

const _forward = new THREE.Vector3();

/** Counts down the per-vehicle fire-rate cooldown; call once per physics step. */
export function updateMachineGunCooldown(vehicle, dt) {
  vehicle.machineGunCooldownRemaining = Math.max(
    0,
    vehicle.machineGunCooldownRemaining - dt,
  );
}

/**
 * Hitscan machine gun fire (research.md §3, FR-003): a raycast from the
 * vehicle's position along its facing direction, range-limited, excluding
 * the shooter's own chassis and sensor colliders (pickups/mines/oil-slick
 * segments — a shot passing near one shouldn't stop there instead of
 * reaching the vehicle behind it). Fires at most once every `1 / fireRate`
 * seconds (unlimited ammo — only fire rate limits it).
 */
export function tryFireMachineGun(world, vehicle, firing) {
  if (!firing || vehicle.eliminated) return;
  if (vehicle.machineGunCooldownRemaining > 0) return;

  vehicle.machineGunCooldownRemaining = 1 / WEAPONS.machineGun.fireRate;

  const origin = vehicle.chassisBody.translation();
  _forward.set(0, 0, 1).applyQuaternion(vehicle.mesh.quaternion);

  const ray = new RAPIER.Ray(
    { x: origin.x, y: origin.y, z: origin.z },
    { x: _forward.x, y: _forward.y, z: _forward.z },
  );
  const hit = world.castRay(
    ray,
    WEAPONS.machineGun.range,
    true,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    undefined,
    undefined,
    vehicle.chassisBody,
  );
  if (!hit) return;

  const hitVehicle = getVehicleByColliderHandle(hit.collider.handle);
  if (hitVehicle && hitVehicle !== vehicle) {
    applyDamage(hitVehicle, WEAPONS.machineGun.damagePerHit);
  }
}
