import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { PICKUPS, WEAPONS } from "../config/tuning.js";
import { getVehicleByColliderHandle } from "./registry.js";

const PICKUP_RADIUS = 1.5;

const WEAPON_COLORS = {
  rockets: 0xff4444,
  homingRockets: 0xffaa00,
  mines: 0xffee00,
  oilSlick: 0x222222,
};

/** Ammo per weapon type (data-model.md PickupWeaponSlot), from WEAPONS config. */
function ammoForWeaponType(weaponType) {
  return WEAPONS[weaponType].ammoPerPickup;
}

/** A fresh PickupWeaponSlot for a vehicle that just collected `weaponType`. */
export function createPickupWeaponSlot(weaponType) {
  return {
    type: weaponType,
    ammo: ammoForWeaponType(weaponType),
    lockState: null,
  };
}

const pickupsByColliderHandle = new Map();

/** Creates a fixed-location pickup (spec Non-Goals: no randomization). */
export function createPickup(world, scene, weaponType, position) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z,
    ),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.ball(PICKUP_RADIUS)
      .setSensor(true)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    body,
  );

  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(1),
    new THREE.MeshStandardMaterial({ color: WEAPON_COLORS[weaponType] }),
  );
  mesh.position.set(position.x, position.y, position.z);
  scene.add(mesh);

  const pickup = {
    weaponType,
    position,
    collider,
    mesh,
    available: true,
    respawnRemaining: 0,
  };
  pickupsByColliderHandle.set(collider.handle, pickup);
  return pickup;
}

/** Counts down a collected pickup's respawn timer (FR-008). */
export function updatePickup(pickup, dt) {
  if (pickup.available) return;
  pickup.respawnRemaining -= dt;
  if (pickup.respawnRemaining <= 0) {
    pickup.available = true;
    pickup.mesh.visible = true;
  }
}

/**
 * Collision-event handler: on contact with an available pickup, grants its
 * weapon to the touching vehicle's inventory (data-model.md
 * Vehicle.weaponSlots) and starts the respawn timer. A vehicle can carry
 * one slot per weapon type at once — collecting a type already held tops
 * its ammo back up to full rather than stacking; collecting a new type
 * adds a slot and selects it, so picking up a weapon always makes it the
 * active one.
 */
export function handlePickupCollision(handle1, handle2, started) {
  if (!started) return;

  const pickup =
    pickupsByColliderHandle.get(handle1) ?? pickupsByColliderHandle.get(handle2);
  if (!pickup || !pickup.available) return;

  const otherHandle = pickupsByColliderHandle.has(handle1) ? handle2 : handle1;
  const vehicle = getVehicleByColliderHandle(otherHandle);
  if (!vehicle || vehicle.eliminated) return;

  const existingIndex = vehicle.weaponSlots.findIndex(
    (slot) => slot.type === pickup.weaponType,
  );
  if (existingIndex >= 0) {
    vehicle.weaponSlots[existingIndex].ammo = ammoForWeaponType(pickup.weaponType);
    vehicle.selectedWeaponIndex = existingIndex;
  } else {
    vehicle.weaponSlots.push(createPickupWeaponSlot(pickup.weaponType));
    vehicle.selectedWeaponIndex = vehicle.weaponSlots.length - 1;
  }

  pickup.available = false;
  pickup.respawnRemaining = PICKUPS.respawnDelay;
  pickup.mesh.visible = false;
}
