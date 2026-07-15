import * as THREE from "three";
import { createPhysicsWorld, FIXED_TIMESTEP, RAPIER } from "./physics/world.js";
import { createArena } from "./arena/arena.js";
import { createFollowCamera } from "./camera/followCamera.js";
import { createInputController } from "./input/inputController.js";
import { createStartGate } from "./input/startGate.js";
import { createVehicle, stepVehicleControl } from "./vehicle/vehicle.js";
import { createSeekBot } from "./combat/seekBot.js";
import { registerVehicle } from "./combat/registry.js";
import { handleRammingCollision } from "./combat/ramming.js";
import { tryFireMachineGun, updateMachineGunCooldown } from "./combat/machineGun.js";
import { createPickup, handlePickupCollision, updatePickup } from "./combat/pickup.js";
import { updateProjectile } from "./combat/projectile.js";
import { updateMine, handleMineCollision } from "./combat/mine.js";
import { updateOilSlickSegment, handleOilSlickCollision } from "./combat/oilSlick.js";
import { updatePickupWeaponUse } from "./combat/pickupWeaponUse.js";
import { ARCHETYPES } from "./config/tuning.js";

const BOT_ARCHETYPE_ID = "balanced";

// Fixed, non-random pickup locations (spec Non-Goals), spread around the
// arena away from the two spawn points.
const PICKUP_LAYOUT = [
  { type: "rockets", position: { x: 20, y: 1, z: 10 } },
  { type: "homingRockets", position: { x: -20, y: 1, z: 10 } },
  { type: "mines", position: { x: 20, y: 1, z: -25 } },
  { type: "oilSlick", position: { x: -20, y: 1, z: -25 } },
];

async function main() {
  const canvas = document.getElementById("app");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
  );
  const followCamera = createFollowCamera(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(20, 30, 10);
  scene.add(sun);

  const world = await createPhysicsWorld();
  createArena(world, scene);
  const eventQueue = new RAPIER.EventQueue(true);
  const collisionHandlers = [
    handleRammingCollision,
    handlePickupCollision,
    (h1, h2, started) => handleMineCollision(world, scene, h1, h2, started),
    handleOilSlickCollision,
  ];

  const pickups = PICKUP_LAYOUT.map(({ type, position }) =>
    createPickup(world, scene, type, position),
  );
  const mines = [];
  const projectiles = [];
  const oilSegments = [];

  const touchControlsEl = document.getElementById("touch-controls");
  const rotatePromptEl = document.getElementById("rotate-prompt");
  const inputController = createInputController(window, {
    onModeChange: (mode) => {
      touchControlsEl.classList.toggle("hidden", mode !== "touch");
    },
    onBlockedChange: (blocked) => {
      rotatePromptEl.classList.toggle("hidden", !blocked);
    },
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const startGate = createStartGate();
  const startGateEl = document.getElementById("start-gate");
  const startButtonEl = document.getElementById("start-button");
  const archetypeSelectEl = document.getElementById("archetype-select");

  let playerVehicle = null;
  let botVehicle = null;
  let seekBot = null;

  let physicsAccumulator = 0;
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const frameDelta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!inputController.isGameplayBlocked()) {
      const inputState = inputController.read();
      const botInputState = seekBot.computeInputState();

      physicsAccumulator += frameDelta;
      while (physicsAccumulator >= FIXED_TIMESTEP) {
        stepVehicleControl(playerVehicle, inputState, FIXED_TIMESTEP);
        stepVehicleControl(botVehicle, botInputState, FIXED_TIMESTEP);

        updateMachineGunCooldown(playerVehicle, FIXED_TIMESTEP);
        updateMachineGunCooldown(botVehicle, FIXED_TIMESTEP);
        tryFireMachineGun(world, playerVehicle, inputState.fire);
        tryFireMachineGun(world, botVehicle, botInputState.fire);

        updatePickupWeaponUse(
          world,
          scene,
          playerVehicle,
          botVehicle,
          inputState,
          FIXED_TIMESTEP,
          { projectiles, mines, oilSegments },
        );

        for (const pickup of pickups) updatePickup(pickup, FIXED_TIMESTEP);
        for (const mine of mines) updateMine(world, scene, mine, FIXED_TIMESTEP);
        for (const segment of oilSegments) {
          updateOilSlickSegment(world, scene, segment, FIXED_TIMESTEP);
        }
        for (const projectile of projectiles) {
          updateProjectile(world, scene, projectile, FIXED_TIMESTEP);
        }
        removeDead(mines);
        removeDead(oilSegments);
        removeDead(projectiles);

        world.step(eventQueue);
        eventQueue.drainCollisionEvents((handle1, handle2, started) => {
          for (const handler of collisionHandlers) {
            handler(handle1, handle2, started);
          }
        });
        physicsAccumulator -= FIXED_TIMESTEP;
      }

      playerVehicle.syncMesh();
      botVehicle.syncMesh();
      followCamera.update(
        frameDelta,
        playerVehicle.mesh.position,
        playerVehicle.mesh.quaternion,
      );
    }

    renderer.render(scene, camera);
  }

  function spawnMatch(playerArchetypeId) {
    playerVehicle = createVehicle(world, scene, ARCHETYPES[playerArchetypeId], {
      spawnPosition: { x: 0, y: 2, z: 0 },
      color: 0x2266dd,
    });
    botVehicle = createVehicle(world, scene, ARCHETYPES[BOT_ARCHETYPE_ID], {
      spawnPosition: { x: 0, y: 2, z: -15 },
      color: 0xdd3333,
    });
    registerVehicle(playerVehicle);
    registerVehicle(botVehicle);
    seekBot = createSeekBot(botVehicle, playerVehicle);
    if (import.meta.env.DEV) {
      window.__debug = { playerVehicle, botVehicle, pickups, mines, projectiles, oilSegments };
      window.__debugWorld = world;
    }
  }

  document
    .querySelectorAll(".archetype-button")
    .forEach((button) =>
      button.addEventListener("click", () => {
        archetypeSelectEl.classList.add("hidden");
        spawnMatch(button.dataset.archetype);
        lastTime = performance.now();
        requestAnimationFrame(animate);
      }),
    );

  startButtonEl.addEventListener("click", async () => {
    await startGate.start(inputController.getMode());
    startGateEl.classList.add("hidden");
    archetypeSelectEl.classList.remove("hidden");
  });
}

function removeDead(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].dead) list.splice(i, 1);
  }
}

main();
