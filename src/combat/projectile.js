import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { WEAPONS } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

const PROJECTILE_COLORS = { rocket: 0xff4444, homingRocket: 0xffaa00 };
// Launch direction blend for homing rockets: a ~45-degree lob (equal
// up/forward weight), not a near-vertical launch. A steeper angle burns
// most of the weapon's range budget just climbing before the turn-rate-
// limited homing can curve back down to the target's altitude — tested
// and confirmed the rocket overshoots and expires mid-air at anything
// close to vertical. This still visibly launches "up and out" from the
// car (spec: "вистрілюється в гору а потім корегує свій курс") while
// leaving enough of a turn budget to actually connect.
const HOMING_LAUNCH_UP = 1;
const HOMING_LAUNCH_FORWARD = 1;

/**
 * Pure: steers a 3D velocity toward `toTarget` by at most `maxTurnRadians`
 * this step (exact spherical interpolation along the great circle between
 * the two directions), preserving speed magnitude (research.md §4 —
 * "dodgeable via sharp direction change": the turn-rate cap is what makes
 * evasion possible). This is what lets a homing rocket launch straight up
 * and gradually curve down toward its target regardless of which way the
 * firing vehicle was facing.
 */
export function computeHomingVelocity3D(velocity, toTarget, maxTurnRadians) {
  const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
  const targetLen = Math.hypot(toTarget.x, toTarget.y, toTarget.z);
  if (speed < 1e-6 || targetLen < 1e-6) {
    return { x: velocity.x, y: velocity.y, z: velocity.z };
  }

  const fromX = velocity.x / speed;
  const fromY = velocity.y / speed;
  const fromZ = velocity.z / speed;
  const toX = toTarget.x / targetLen;
  const toY = toTarget.y / targetLen;
  const toZ = toTarget.z / targetLen;

  const dot = Math.min(1, Math.max(-1, fromX * toX + fromY * toY + fromZ * toZ));
  const angle = Math.acos(dot);
  if (angle < 1e-6) {
    return { x: fromX * speed, y: fromY * speed, z: fromZ * speed };
  }

  const clampedAngle = Math.min(angle, maxTurnRadians);
  const sinAngle = Math.sin(angle);
  if (sinAngle < 1e-6) {
    // from/to are exactly opposite — any perpendicular turn direction is
    // equally valid; snapping straight to the target is a safe fallback
    // for this practically-unreachable edge case.
    return { x: toX * speed, y: toY * speed, z: toZ * speed };
  }

  const a = Math.sin(angle - clampedAngle) / sinAngle;
  const b = Math.sin(clampedAngle) / sinAngle;
  return {
    x: (a * fromX + b * toX) * speed,
    y: (a * fromY + b * toY) * speed,
    z: (a * fromZ + b * toZ) * speed,
  };
}

function computeInitialVelocity(kind, config, directionXZ, origin, target) {
  if (kind !== "homingRocket") {
    const len = Math.hypot(directionXZ.x, directionXZ.z) || 1;
    return {
      x: (directionXZ.x / len) * config.projectileSpeed,
      y: 0,
      z: (directionXZ.z / len) * config.projectileSpeed,
    };
  }

  // The horizontal lean is toward the TARGET, not the shooter's facing —
  // targeting.js's search is omnidirectional (360°), so the target can be
  // behind the vehicle; leaning toward its own facing in that case would
  // launch the rocket away from the target and waste even more of its
  // turn/range budget correcting a near-180° error.
  let dx = directionXZ.x;
  let dz = directionXZ.z;
  if (target) {
    const targetPos = target.chassisBody.translation();
    dx = targetPos.x - origin.x;
    dz = targetPos.z - origin.z;
  }

  const dirLen = Math.hypot(dx, dz) || 1;
  const rawX = (dx / dirLen) * HOMING_LAUNCH_FORWARD;
  const rawY = HOMING_LAUNCH_UP;
  const rawZ = (dz / dirLen) * HOMING_LAUNCH_FORWARD;
  const rawLen = Math.hypot(rawX, rawY, rawZ);
  return {
    x: (rawX / rawLen) * config.projectileSpeed,
    y: (rawY / rawLen) * config.projectileSpeed,
    z: (rawZ / rawLen) * config.projectileSpeed,
  };
}

/**
 * Kinematic (non-physics-body) projectile (research.md §4). `kind` is
 * `rocket` (straight line) or `homingRocket` (launches in a lob arc leaning
 * toward `target`, then curves the rest of the way via
 * computeHomingVelocity3D).
 */
export function createProjectile(scene, kind, origin, directionXZ, ownerVehicle, target = null) {
  const config = kind === "rocket" ? WEAPONS.rockets : WEAPONS.homingRockets;
  const velocity = computeInitialVelocity(kind, config, directionXZ, origin, target);

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
    projectile.velocity = computeHomingVelocity3D(
      projectile.velocity,
      {
        x: targetPos.x - projectile.position.x,
        y: targetPos.y - projectile.position.y,
        z: targetPos.z - projectile.position.z,
      },
      WEAPONS.homingRockets.turnRate * dt,
    );
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
