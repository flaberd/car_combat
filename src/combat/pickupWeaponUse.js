import * as THREE from "three";
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
 * previous), wrapping around. No-op with an empty inventory.
 */
export function switchWeapon(vehicle, direction) {
  const slots = vehicle.weaponSlots;
  if (slots.length === 0) return;

  vehicle.selectedWeaponIndex =
    (vehicle.selectedWeaponIndex + direction + slots.length) % slots.length;
}

/**
 * Dispatches `InputState.usePickup` to the vehicle's selected weapon slot
 * (data-model.md PickupWeaponSlot, FR-009/FR-010/FR-011/FR-012). Every
 * weapon here fires on the rising edge (a quick tap), including homing
 * rockets — the old hold-to-lock mechanic is gone. Homing rockets instead
 * fire at whatever `vehicle.activeTarget` currently is (kept up to date
 * externally by src/combat/targeting.js against this weapon's targeting
 * cone/radius); with no target in range, tapping Use does nothing.
 * `collections` is `{ projectiles, mines, oilSegments }` — arrays owned by
 * main.js that this function pushes newly created entities into.
 */
export function updatePickupWeaponUse(world, scene, vehicle, inputState, collections) {
  const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex] ?? null;
  const wasHeld = vehicle.previousUsePickup;
  vehicle.previousUsePickup = inputState.usePickup;

  const usePressed = inputState.usePickup && !wasHeld;
  if (!slot || !usePressed) return;

  const origin = vehicle.chassisBody.translation();
  _forward.set(0, 0, 1).applyQuaternion(vehicle.mesh.quaternion);

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
  } else if (slot.type === "homingRockets") {
    if (!vehicle.activeTarget) return; // no target in range/cone -> nothing to fire at
    collections.projectiles.push(
      createProjectile(
        scene,
        "homingRocket",
        origin,
        { x: _forward.x, z: _forward.z },
        vehicle,
        vehicle.activeTarget,
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
