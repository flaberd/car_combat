import * as THREE from "three";
import { createPhysicsWorld, FIXED_TIMESTEP, RAPIER } from "./physics/world.js";
import { createArena } from "./arena/arena.js";
import { createFollowCamera } from "./camera/followCamera.js";
import { createInputController } from "./input/inputController.js";
import { createStartGate } from "./input/startGate.js";
import { createVehicle, stepVehicleControl } from "./vehicle/vehicle.js";
import { createSeekBot } from "./combat/seekBot.js";
import { registerVehicle, unregisterVehicle, getAllVehicles } from "./combat/registry.js";
import { handleRammingCollision } from "./combat/ramming.js";
import {
  tryFireMachineGun,
  updateMachineGunCooldown,
  updateTracer,
} from "./combat/machineGun.js";
import { createPickup, handlePickupCollision, updatePickup } from "./combat/pickup.js";
import { updateProjectile } from "./combat/projectile.js";
import { updateMine, handleMineCollision } from "./combat/mine.js";
import { updateOilSlickSegment, handleOilSlickCollision } from "./combat/oilSlick.js";
import { updatePickupWeaponUse, switchWeapon } from "./combat/pickupWeaponUse.js";
import { findBestTarget, createTargetMarker, updateTargetMarker } from "./combat/targeting.js";
import { createWorldHealthBar, updateWorldHealthBar } from "./ui/worldHealthBar.js";
import { ARCHETYPES, WEAPONS } from "./config/tuning.js";
import { createHud } from "./ui/hud.js";

const BOT_ARCHETYPE_ID = "balanced";
const BOT_SPAWN_POSITION = { x: 0, y: 2, z: -15 };
const BOT_RESPAWN_DELAY = 2; // seconds after elimination before a fresh bot appears

// Fixed, non-random pickup locations (spec Non-Goals), spread around the
// arena away from the two spawn points.
const PICKUP_LAYOUT = [
  { type: "rockets", position: { x: 20, y: 1, z: 10 } },
  { type: "homingRockets", position: { x: -20, y: 1, z: 10 } },
  { type: "mines", position: { x: 20, y: 1, z: -25 } },
  { type: "oilSlick", position: { x: -20, y: 1, z: -25 } },
];

// Video-recording mode (?video in the URL): a dev-only presentation toggle,
// not a gameplay feature — hides the HUD and every touch button except the
// movement joystick, and skips spawning the bot/pickups, so a clean driving
// clip can be recorded without combat or UI clutter in frame.
const VIDEO_MODE = new URLSearchParams(window.location.search).has("video");

async function main() {
  if (VIDEO_MODE) document.body.classList.add("video-mode");

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

  const pickups = VIDEO_MODE
    ? []
    : PICKUP_LAYOUT.map(({ type, position }) =>
        createPickup(world, scene, type, position),
      );
  const mines = [];
  const projectiles = [];
  const oilSegments = [];
  const tracers = [];
  const targetMarker = createTargetMarker(scene);
  const botHealthBar = createWorldHealthBar(scene);

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
  const gameOverEl = document.getElementById("game-over");
  const restartButtonEl = document.getElementById("restart-button");
  const hud = createHud(document);

  let playerVehicle = null;
  let botVehicle = null;
  let seekBot = null;
  // True once the player is eliminated (Game Over shown); freezes further
  // physics/combat updates so the final frame stays put behind the overlay.
  // "Play Again" reloads the page — simplest way to reset every subsystem's
  // state (vehicles, mines/projectiles/oil segments, pickup availability,
  // the combat registry) back to a clean slate, matching this project's
  // existing no-persistence design (data-model.md: nothing survives a
  // reload) rather than hand-rolling teardown for each one.
  let matchOver = false;
  // Counts down after the bot is eliminated and removed, until a fresh one
  // spawns — 0 means "no respawn pending" (either a bot already exists, or
  // none is due yet).
  let botRespawnRemaining = 0;

  let physicsAccumulator = 0;
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const frameDelta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!inputController.isGameplayBlocked()) {
      if (!matchOver) {
        const inputState = inputController.read();

        // Weapon switching is edge-triggered per animate() frame (like the
        // input read itself), not per physics substep — otherwise a single
        // button press could cycle through several weapons in one frame.
        if (inputState.switchWeaponPrev) switchWeapon(playerVehicle, -1);
        if (inputState.switchWeaponNext) switchWeapon(playerVehicle, 1);

        updateActiveTarget(playerVehicle);
        updateTargetMarker(targetMarker, playerVehicle.activeTarget, frameDelta);

        physicsAccumulator += frameDelta;
        while (physicsAccumulator >= FIXED_TIMESTEP) {
          stepVehicleControl(playerVehicle, inputState, FIXED_TIMESTEP);
          updateMachineGunCooldown(playerVehicle, FIXED_TIMESTEP);
          tryFireMachineGun(world, scene, playerVehicle, inputState.fire, tracers);

          if (botVehicle) {
            // Recomputed fresh every substep (not once per frame) — the bot
            // can be removed and a fresh one spawned mid-loop (several
            // substeps can run per animate() frame), and a stale input
            // object from before a respawn would be `null` for a plain
            // vehicle field access to crash on.
            const botInputState = seekBot.computeInputState();
            stepVehicleControl(botVehicle, botInputState, FIXED_TIMESTEP);
            updateMachineGunCooldown(botVehicle, FIXED_TIMESTEP);
            tryFireMachineGun(world, scene, botVehicle, botInputState.fire, tracers);
          }

          updatePickupWeaponUse(world, scene, playerVehicle, inputState, {
            projectiles,
            mines,
            oilSegments,
          });

          for (const pickup of pickups) updatePickup(pickup, FIXED_TIMESTEP);
          for (const mine of mines) updateMine(world, scene, mine, FIXED_TIMESTEP);
          for (const segment of oilSegments) {
            updateOilSlickSegment(world, scene, segment, FIXED_TIMESTEP);
          }
          for (const projectile of projectiles) {
            updateProjectile(world, scene, projectile, FIXED_TIMESTEP);
          }
          for (const tracer of tracers) {
            updateTracer(scene, tracer, FIXED_TIMESTEP);
          }
          removeDead(mines);
          removeDead(oilSegments);
          removeDead(projectiles);
          removeDead(tracers);

          world.step(eventQueue);
          eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            for (const handler of collisionHandlers) {
              handler(handle1, handle2, started);
            }
          });
          physicsAccumulator -= FIXED_TIMESTEP;

          if (playerVehicle.eliminated) {
            matchOver = true;
            break;
          }

          if (botVehicle?.eliminated) {
            removeBotVehicle();
            botRespawnRemaining = BOT_RESPAWN_DELAY;
          } else if (!botVehicle && botRespawnRemaining > 0) {
            botRespawnRemaining -= FIXED_TIMESTEP;
            if (botRespawnRemaining <= 0) spawnBot();
          }
        }

        playerVehicle.syncMesh();
        botVehicle?.syncMesh();
        followCamera.update(
          frameDelta,
          playerVehicle.mesh.position,
          playerVehicle.mesh.quaternion,
        );
        hud.update(playerVehicle);
        updateWorldHealthBar(botHealthBar, botVehicle, camera);

        if (matchOver) {
          gameOverEl.classList.remove("hidden");
        }
      }
    }

    renderer.render(scene, camera);
  }

  /** Creates a fresh bot vehicle + seekBot AI, used both for the initial spawn and every respawn. */
  function spawnBot() {
    botVehicle = createVehicle(world, scene, ARCHETYPES[BOT_ARCHETYPE_ID], {
      spawnPosition: BOT_SPAWN_POSITION,
      color: 0xdd3333,
    });
    registerVehicle(botVehicle);
    seekBot = createSeekBot(botVehicle, playerVehicle);
    if (import.meta.env.DEV && window.__debug) {
      window.__debug.botVehicle = botVehicle;
    }
  }

  /** Fully removes the eliminated bot (mesh, physics body, registry entry) — no lingering wreck. */
  function removeBotVehicle() {
    scene.remove(botVehicle.mesh);
    for (const wheelMesh of botVehicle.wheelMeshes) scene.remove(wheelMesh);
    unregisterVehicle(botVehicle);
    world.removeRigidBody(botVehicle.chassisBody);
    botVehicle = null;
    seekBot = null;
    if (import.meta.env.DEV && window.__debug) {
      window.__debug.botVehicle = null;
    }
  }

  function spawnMatch(playerArchetypeId) {
    playerVehicle = createVehicle(world, scene, ARCHETYPES[playerArchetypeId], {
      spawnPosition: { x: 0, y: 2, z: 0 },
      color: 0x2266dd,
    });
    registerVehicle(playerVehicle);
    if (!VIDEO_MODE) spawnBot();
    if (import.meta.env.DEV) {
      window.__debug = {
        playerVehicle,
        botVehicle,
        pickups,
        mines,
        projectiles,
        oilSegments,
        tracers,
        targetMarker,
        botHealthBar,
      };
      window.__debugWorld = world;
    }
  }

  document
    .querySelectorAll(".archetype-button")
    .forEach((button) =>
      button.addEventListener("click", () => {
        archetypeSelectEl.classList.add("hidden");
        spawnMatch(button.dataset.archetype);
        if (!VIDEO_MODE) hud.show();
        hud.update(playerVehicle);
        lastTime = performance.now();
        requestAnimationFrame(animate);
      }),
    );

  startButtonEl.addEventListener("click", async () => {
    await startGate.start(inputController.getMode());
    startGateEl.classList.add("hidden");
    archetypeSelectEl.classList.remove("hidden");
  });

  restartButtonEl.addEventListener("click", () => {
    window.location.reload();
  });
}

function removeDead(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].dead) list.splice(i, 1);
  }
}

const _targetForward = new THREE.Vector3();
const _targetQuat = new THREE.Quaternion();

/**
 * Recomputes `vehicle.activeTarget` from the currently selected weapon's
 * targeting config (WEAPONS[type].targetingConeDegrees) — only weapons
 * that need auto-targeting (currently just homing rockets) set that field,
 * so this is a no-op (activeTarget stays null) for every other weapon.
 */
function updateActiveTarget(vehicle) {
  const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex];
  const config = slot ? WEAPONS[slot.type] : null;
  if (!config?.targetingConeDegrees) {
    vehicle.activeTarget = null;
    return;
  }

  const rotation = vehicle.chassisBody.rotation();
  _targetQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
  _targetForward.set(0, 0, 1).applyQuaternion(_targetQuat);

  vehicle.activeTarget = findBestTarget(
    vehicle.chassisBody.translation(),
    { x: _targetForward.x, z: _targetForward.z },
    getAllVehicles().filter((candidate) => candidate !== vehicle),
    { radius: config.range, coneDegrees: config.targetingConeDegrees },
  );
}

main();
