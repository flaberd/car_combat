import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { WEAPONS } from "../config/tuning.js";
import { getVehicleByColliderHandle } from "./registry.js";

const SEGMENT_RADIUS = 1.2;

const segmentsByColliderHandle = new Map();
// vehicle -> count of currently-overlapping segments (data-model.md
// OilSlickSegment.occupantVehicles, tracked per-vehicle here since a
// vehicle can be in more than one segment's trail at once).
const occupancyCountByVehicle = new Map();

/**
 * Pure: next occupancy count for a vehicle entering (+1) or exiting (-1) an
 * oil-slick segment, and whether the friction effect should now apply
 * (count > 0). Extracted for testability without a physics world
 * (research.md §11).
 */
export function computeOilOccupancyChange(currentCount, delta) {
  const nextCount = Math.max(0, currentCount + delta);
  return { count: nextCount, inOil: nextCount > 0 };
}

function setVehicleOilOccupancy(vehicle, delta) {
  const current = occupancyCountByVehicle.get(vehicle) ?? 0;
  const { count, inOil } = computeOilOccupancyChange(current, delta);
  if (count === 0) {
    occupancyCountByVehicle.delete(vehicle);
  } else {
    occupancyCountByVehicle.set(vehicle, count);
  }
  vehicle.oilSlickMultiplier = inOil ? WEAPONS.oilSlick.frictionMultiplier : 1;
}

/**
 * Deploys an oil-slick trail (data-model.md OilSlickSegment): several
 * segments laid out behind `ownerVehicle` covering the configured trail
 * length (research.md §6).
 */
export function deployOilSlick(world, scene, originPosition, directionXZ, ownerVehicle) {
  const { trailLength, segmentCount, effectDuration } = WEAPONS.oilSlick;
  const len = Math.hypot(directionXZ.x, directionXZ.z) || 1;
  const stepX = (-directionXZ.x / len) * (trailLength / segmentCount);
  const stepZ = (-directionXZ.z / len) * (trailLength / segmentCount);

  const segments = [];
  for (let i = 0; i < segmentCount; i++) {
    const position = {
      x: originPosition.x + stepX * (i + 1),
      y: originPosition.y,
      z: originPosition.z + stepZ * (i + 1),
    };

    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        position.x,
        position.y,
        position.z,
      ),
    );
    const collider = world.createCollider(
      RAPIER.ColliderDesc.ball(SEGMENT_RADIUS)
        .setSensor(true)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );

    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(SEGMENT_RADIUS, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, position.y + 0.02, position.z);
    scene.add(mesh);

    const segment = {
      body,
      collider,
      mesh,
      lifetimeRemaining: effectDuration,
      occupantVehicles: new Set(),
      dead: false,
      owner: ownerVehicle,
    };
    segmentsByColliderHandle.set(collider.handle, segment);
    segments.push(segment);
  }
  return segments;
}

/** Counts down a segment's lifetime, releasing any occupants and despawning at 0. */
export function updateOilSlickSegment(world, scene, segment, dt) {
  if (segment.dead) return;
  segment.lifetimeRemaining -= dt;
  if (segment.lifetimeRemaining <= 0) {
    removeSegment(world, scene, segment);
  }
}

/** Collision-event handler: tracks vehicles entering/exiting an oil-slick segment. */
export function handleOilSlickCollision(handle1, handle2, started) {
  const segment =
    segmentsByColliderHandle.get(handle1) ?? segmentsByColliderHandle.get(handle2);
  if (!segment || segment.dead) return;

  const otherHandle = segmentsByColliderHandle.has(handle1) ? handle2 : handle1;
  const vehicle = getVehicleByColliderHandle(otherHandle);
  if (!vehicle) return;

  if (started) {
    if (!segment.occupantVehicles.has(vehicle)) {
      segment.occupantVehicles.add(vehicle);
      setVehicleOilOccupancy(vehicle, 1);
    }
  } else if (segment.occupantVehicles.has(vehicle)) {
    segment.occupantVehicles.delete(vehicle);
    setVehicleOilOccupancy(vehicle, -1);
  }
}

function removeSegment(world, scene, segment) {
  segment.dead = true;
  segmentsByColliderHandle.delete(segment.collider.handle);
  for (const vehicle of segment.occupantVehicles) {
    setVehicleOilOccupancy(vehicle, -1);
  }
  segment.occupantVehicles.clear();
  scene.remove(segment.mesh);
  world.removeRigidBody(segment.body);
}
