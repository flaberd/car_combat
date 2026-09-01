import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { WEAPONS } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

const _forward = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _end = new THREE.Vector3();

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
 *
 * A hitscan shot has no travelling projectile mesh, so it needs an explicit
 * tracer line for the player to see it fired at all — every fired shot
 * (hit or miss) pushes one into `tracers`, owned/ticked by the caller the
 * same way mines/oilSegments/projectiles are (see `updateTracer` below).
 */
export function tryFireMachineGun(world, scene, vehicle, firing, tracers) {
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

  const travelDistance = hit ? hit.timeOfImpact : WEAPONS.machineGun.range;
  _origin.set(origin.x, origin.y, origin.z);
  _end.copy(_origin).addScaledVector(_forward, travelDistance);
  tracers.push(createTracer(scene, _origin, _end));

  if (!hit) return;

  const hitVehicle = getVehicleByColliderHandle(hit.collider.handle);
  if (hitVehicle && hitVehicle !== vehicle) {
    applyDamage(hitVehicle, WEAPONS.machineGun.damagePerHit);
  }
}

function createTracer(scene, start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    start.clone(),
    end.clone(),
  ]);
  const mesh = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xffff66 }),
  );
  scene.add(mesh);
  return { mesh, lifetimeRemaining: WEAPONS.machineGun.tracerLifetime, dead: false };
}

/** Counts down a tracer's short on-screen lifetime, despawning it at 0. */
export function updateTracer(scene, tracer, dt) {
  if (tracer.dead) return;
  tracer.lifetimeRemaining -= dt;
  if (tracer.lifetimeRemaining <= 0) {
    tracer.dead = true;
    scene.remove(tracer.mesh);
  }
}
