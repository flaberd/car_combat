import * as THREE from "three";
import { WEAPONS } from "../config/tuning.js";
import { createProjectile } from "./projectile.js";
import { createMine } from "./mine.js";
import { deployOilSlick } from "./oilSlick.js";

const _forward = new THREE.Vector3();

function consumeAmmo(vehicle, slot) {
  slot.ammo -= 1;
  if (slot.ammo <= 0) {
    vehicle.pickupWeapon = null;
  }
}

/**
 * Dispatches `InputState.usePickup` to the vehicle's active pickup weapon
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
  const slot = vehicle.pickupWeapon;
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
      consumeAmmo(vehicle, slot);
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
    consumeAmmo(vehicle, slot);
  } else if (slot.type === "mines") {
    const behind = {
      x: origin.x - _forward.x * 2,
      y: origin.y,
      z: origin.z - _forward.z * 2,
    };
    collections.mines.push(createMine(world, scene, behind));
    consumeAmmo(vehicle, slot);
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
    consumeAmmo(vehicle, slot);
  }
}
