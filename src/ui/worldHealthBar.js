import * as THREE from "three";

const BAR_WIDTH = 2;
const BAR_HEIGHT = 0.25;
const BAR_Y_OFFSET = 2.6; // above the vehicle's chassis

const LOW_HP_RATIO = 0.5;
const CRITICAL_HP_RATIO = 0.25;
const COLOR_FULL = 0x3ecf5f;
const COLOR_LOW = 0xe2b93b;
const COLOR_CRITICAL = 0xe04b4b;

/**
 * Floating world-space HP bar that hovers over a vehicle and always faces
 * the camera (billboard) — used for the bot, since its HP isn't otherwise
 * visible to the player the way the player's own HUD shows theirs.
 */
export function createWorldHealthBar(scene) {
  const group = new THREE.Group();

  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_WIDTH, BAR_HEIGHT),
    new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.75,
      depthTest: false,
      depthWrite: false,
    }),
  );
  bg.renderOrder = 999;
  group.add(bg);

  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_WIDTH, BAR_HEIGHT),
    new THREE.MeshBasicMaterial({
      color: COLOR_FULL,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  fill.position.z = 0.01; // in front of bg, avoids z-fighting
  fill.renderOrder = 1000;
  group.add(fill);

  group.visible = false;
  scene.add(group);

  return { group, fill };
}

/** Repositions/rescales the bar over `vehicle`, or hides it when there's nothing to show. */
export function updateWorldHealthBar(healthBar, vehicle, camera) {
  if (!vehicle || vehicle.eliminated) {
    healthBar.group.visible = false;
    return;
  }

  const pos = vehicle.chassisBody.translation();
  healthBar.group.position.set(pos.x, pos.y + BAR_Y_OFFSET, pos.z);
  healthBar.group.quaternion.copy(camera.quaternion);

  const ratio = Math.max(0, Math.min(1, vehicle.hp / vehicle.archetype.maxHp));
  healthBar.fill.scale.x = Math.max(0.001, ratio);
  healthBar.fill.position.x = -(BAR_WIDTH / 2) * (1 - ratio);
  healthBar.fill.material.color.setHex(
    ratio <= CRITICAL_HP_RATIO
      ? COLOR_CRITICAL
      : ratio <= LOW_HP_RATIO
        ? COLOR_LOW
        : COLOR_FULL,
  );

  healthBar.group.visible = true;
}
