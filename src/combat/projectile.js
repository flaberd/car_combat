import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { WEAPONS } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

const PROJECTILE_COLORS = { rocket: 0xff4444, homingRocket: 0xffaa00 };

/**
 * Pure: steers a horizontal (x/z) velocity toward a target direction by at
 * most `maxTurnRadians` this step, preserving speed magnitude (research.md
 * §4 — "dodgeable via sharp direction change": the turn-rate cap is what
 * makes evasion possible).
 */
export function computeHomingVelocity(velX, velZ, toTargetX, toTargetZ, maxTurnRadians) {
  const speed = Math.hypot(velX, velZ);
  const targetLen = Math.hypot(toTargetX, toTargetZ);
  if (speed < 1e-6 || targetLen < 1e-6) return { x: velX, z: velZ };

  const currentAngle = Math.atan2(velX, velZ);
  const targetAngle = Math.atan2(toTargetX, toTargetZ);
  let diff = targetAngle - currentAngle;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // normalize to [-PI, PI]

  const clampedDiff = Math.max(-maxTurnRadians, Math.min(maxTurnRadians, diff));
  const newAngle = currentAngle + clampedDiff;

  return { x: Math.sin(newAngle) * speed, z: Math.cos(newAngle) * speed };
}

/**
 * Kinematic (non-physics-body) projectile (research.md §4). `kind` is
 * `rocket` (straight line) or `homingRocket` (steers toward `target`).
 */
export function createProjectile(scene, kind, origin, directionXZ, ownerVehicle, target = null) {
  const config = kind === "rocket" ? WEAPONS.rockets : WEAPONS.homingRockets;
  const len = Math.hypot(directionXZ.x, directionXZ.z) || 1;
  const velocity = {
    x: (directionXZ.x / len) * config.projectileSpeed,
    y: 0,
    z: (directionXZ.z / len) * config.projectileSpeed,
  };

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshStandardMaterial({ color: PROJECTILE_COLORS[kind] }),
  );
  mesh.position.set(origin.x, origin.y, origin.z);
  scene.add(mesh);

  return {
    kind,
    position: { x: origin.x, y: origin.y, z: origin.z },
    velocity,
    mesh,
    ownerVehicle,
    target,
    remainingRange: config.range,
    dead: false,
  };
}

/**
 * Advances a projectile one physics step, homing (if applicable) and
 * hit-testing via raycast. The raycast excludes sensor colliders
 * (pickups/mines/oil-slick segments) so a projectile fired near one
 * doesn't fizzle against it instead of the vehicle behind it — same fix
 * as the vehicle wheel raycast in src/vehicle/vehicle.js.
 */
export function updateProjectile(world, scene, projectile, dt) {
  if (projectile.dead) return;

  if (
    projectile.kind === "homingRocket" &&
    projectile.target &&
    !projectile.target.eliminated
  ) {
    const targetPos = projectile.target.chassisBody.translation();
    const homed = computeHomingVelocity(
      projectile.velocity.x,
      projectile.velocity.z,
      targetPos.x - projectile.position.x,
      targetPos.z - projectile.position.z,
      WEAPONS.homingRockets.turnRate * dt,
    );
    projectile.velocity.x = homed.x;
    projectile.velocity.z = homed.z;
  }

  const step = {
    x: projectile.velocity.x * dt,
    y: projectile.velocity.y * dt,
    z: projectile.velocity.z * dt,
  };
  const travelDist = Math.hypot(step.x, step.y, step.z);

  if (travelDist > 1e-9) {
    const ray = new RAPIER.Ray(projectile.position, step);
    const hit = world.castRay(
      ray,
      1,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      undefined,
      projectile.ownerVehicle.chassisBody,
    );
    if (hit && hit.timeOfImpact <= 1) {
      const hitVehicle = getVehicleByColliderHandle(hit.collider.handle);
      if (hitVehicle && hitVehicle !== projectile.ownerVehicle) {
        const config =
          projectile.kind === "rocket" ? WEAPONS.rockets : WEAPONS.homingRockets;
        applyDamage(hitVehicle, config.damagePerHit);
      }
      killProjectile(scene, projectile);
      return;
    }
  }

  projectile.position.x += step.x;
  projectile.position.y += step.y;
  projectile.position.z += step.z;
  projectile.mesh.position.set(
    projectile.position.x,
    projectile.position.y,
    projectile.position.z,
  );

  projectile.remainingRange -= travelDist;
  if (projectile.remainingRange <= 0) {
    killProjectile(scene, projectile);
  }
}

function killProjectile(scene, projectile) {
  projectile.dead = true;
  scene.remove(projectile.mesh);
}
