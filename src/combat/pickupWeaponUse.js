import * as THREE from "three";
import { WEAPONS } from "../config/tuning.js";
import { createProjectile } from "./projectile.js";
import { createMine } from "./mine.js";
import { deployOilSlick } from "./oilSlick.js";

const _forward = new THREE.Vector3();

function consumeAmmo(vehicle) {
  const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex];
  slot.ammo -= 1;
  if (slot.ammo <= 0) {
    vehicle.weaponSlots.splice(vehicle.selectedWeaponIndex, 1);
    if (vehicle.selectedWeaponIndex >= vehicle.weaponSlots.length) {
      vehicle.selectedWeaponIndex = Math.max(0, vehicle.weaponSlots.length - 1);
    }
  }
}

/**
 * Cycles the vehicle's selected weapon slot by `direction` (+1 next, -1
 * previous), wrapping around. No-op with an empty inventory. Cancels any
 * in-progress homing-rocket lock on the slot being switched away from,
 * since its hold-to-lock state no longer applies once it's not selected.
 */
export function switchWeapon(vehicle, direction) {
  const slots = vehicle.weaponSlots;
  if (slots.length === 0) return;

  const currentSlot = slots[vehicle.selectedWeaponIndex];
  if (currentSlot?.lockState) currentSlot.lockState = null;

  vehicle.selectedWeaponIndex =
    (vehicle.selectedWeaponIndex + direction + slots.length) % slots.length;
}

/**
 * Dispatches `InputState.usePickup` to the vehicle's selected weapon slot
 * (data-model.md PickupWeaponSlot, FR-009/FR-010/FR-011/FR-012, spec
 * "Weapon fire input" research.md §9). Rockets/mines/oil slick fire on the
 * rising edge; homing rockets accumulate lock progress while held and
 * auto-fire once `lockOnTime` elapses, cancelling if released early.
 * `collections` is `{ projectiles, mines, oilSegments }` — arrays owned by
 * main.js that this function pushes newly created entities into.
 */
export function updatePickupWeaponUse(
  world,
  scene,
  vehicle,
  opponentVehicle,
  inputState,
  dt,
  collections,
) {
  const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex] ?? null;
  const wasHeld = vehicle.previousUsePickup;
  vehicle.previousUsePickup = inputState.usePickup;

  if (!slot) return;

  const origin = vehicle.chassisBody.translation();
  _forward.set(0, 0, 1).applyQuaternion(vehicle.mesh.quaternion);

  if (slot.type === "homingRockets") {
    if (!inputState.usePickup) {
      slot.lockState = null; // released before lock completed -> cancel
      return;
    }
    if (!slot.lockState) {
      slot.lockState = { progress: 0, targetVehicle: opponentVehicle };
    }
    slot.lockState.progress += dt;
    if (slot.lockState.progress >= WEAPONS.homingRockets.lockOnTime) {
      collections.projectiles.push(
        createProjectile(
          scene,
          "homingRocket",
          origin,
          { x: _forward.x, z: _forward.z },
          vehicle,
          opponentVehicle,
        ),
      );
      slot.lockState = null;
      consumeAmmo(vehicle);
    }
    return;
  }

  const usePressed = inputState.usePickup && !wasHeld;
  if (!usePressed) return;

  if (slot.type === "rockets") {
    collections.projectiles.push(
      createProjectile(
        scene,
        "rocket",
        origin,
        { x: _forward.x, z: _forward.z },
        vehicle,
      ),
    );
    consumeAmmo(vehicle);
  } else if (slot.type === "mines") {
    const behind = {
      x: origin.x - _forward.x * 2,
      y: origin.y,
      z: origin.z - _forward.z * 2,
    };
    collections.mines.push(createMine(world, scene, behind));
    consumeAmmo(vehicle);
  } else if (slot.type === "oilSlick") {
    collections.oilSegments.push(
      ...deployOilSlick(
        world,
        scene,
        origin,
        { x: _forward.x, z: _forward.z },
        vehicle,
      ),
    );
    consumeAmmo(vehicle);
  }
}
