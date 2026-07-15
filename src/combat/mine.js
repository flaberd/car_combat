import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { WEAPONS } from "../config/tuning.js";
import { applyDamage } from "../vehicle/vehicle.js";
import { getVehicleByColliderHandle } from "./registry.js";

const minesByColliderHandle = new Map();

/** Deploys a mine (data-model.md Mine): inert for `armDelay`, then armed until `lifetime` or triggered. */
export function createMine(world, scene, position) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z,
    ),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.ball(WEAPONS.mines.triggerRadius)
      .setSensor(true)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    body,
  );

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xffee00 }),
  );
  mesh.position.set(position.x, position.y, position.z);
  scene.add(mesh);

  const mine = {
    body,
    collider,
    mesh,
    armDelayRemaining: WEAPONS.mines.armDelay,
    lifetimeRemaining: WEAPONS.mines.lifetime,
    dead: false,
  };
  minesByColliderHandle.set(collider.handle, mine);
  return mine;
}

/**
 * Pure: one timer tick for a mine's arm-delay/lifetime state machine
 * (data-model.md Mine). While `armDelayRemaining > 0` the mine is inert and
 * only that timer counts down; once it reaches 0, `lifetimeRemaining`
 * starts counting down instead, and `expired` becomes true at 0 (the mine
 * despawns untriggered).
 */
export function computeMineTimerTick(state, dt) {
  if (state.armDelayRemaining > 0) {
    return {
      armDelayRemaining: state.armDelayRemaining - dt,
      lifetimeRemaining: state.lifetimeRemaining,
      expired: false,
    };
  }
  const lifetimeRemaining = state.lifetimeRemaining - dt;
  return {
    armDelayRemaining: 0,
    lifetimeRemaining,
    expired: lifetimeRemaining <= 0,
  };
}

/** Counts down arm delay then lifetime; despawns an untriggered mine at 0 lifetime. */
export function updateMine(world, scene, mine, dt) {
  if (mine.dead) return;

  const next = computeMineTimerTick(mine, dt);
  mine.armDelayRemaining = next.armDelayRemaining;
  mine.lifetimeRemaining = next.lifetimeRemaining;
  if (next.expired) {
    removeMine(world, scene, mine);
  }
}

/**
 * Collision-event handler: once armed, detonates on contact with any
 * vehicle — including the mine's own placer (spec Edge Cases: no placer
 * exemption after arming).
 */
export function handleMineCollision(world, scene, handle1, handle2, started) {
  if (!started) return;

  const mine = minesByColliderHandle.get(handle1) ?? minesByColliderHandle.get(handle2);
  if (!mine || mine.dead || mine.armDelayRemaining > 0) return;

  const otherHandle = minesByColliderHandle.has(handle1) ? handle2 : handle1;
  const vehicle = getVehicleByColliderHandle(otherHandle);
  if (!vehicle || vehicle.eliminated) return;

  applyDamage(vehicle, WEAPONS.mines.damageOnTrigger);
  removeMine(world, scene, mine);
}

function removeMine(world, scene, mine) {
  mine.dead = true;
  minesByColliderHandle.delete(mine.collider.handle);
  scene.remove(mine.mesh);
  world.removeRigidBody(mine.body);
}
