import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { VEHICLE_SHAPE } from "../config/tuning.js";
import { applyTractionState, computeTractionState } from "./drift.js";
import { createTurboState, updateTurboState } from "./turbo.js";

// Front wheels steer, rear wheels drive — a conventional RWD layout.
// x/z are multipliers against VEHICLE_SHAPE.trackHalf/wheelBaseHalf.
const WHEEL_DEFS = [
  { x: -1, z: 1, steer: true, drive: false }, // front-left
  { x: 1, z: 1, steer: true, drive: false }, // front-right
  { x: -1, z: -1, steer: false, drive: true }, // rear-left
  { x: 1, z: -1, steer: false, drive: true }, // rear-right
];

const SUSPENSION_DIRECTION = { x: 0, y: -1, z: 0 };
const AXLE_DIRECTION = { x: -1, y: 0, z: 0 };

const WHEEL_BASE_QUAT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  Math.PI / 2,
);
const _steerQuat = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _wheelLocalOffset = new THREE.Vector3();

/**
 * Creates a vehicle: a Rapier dynamic chassis driven entirely by a
 * DynamicRayCastVehicleController (Principle II/IX — no scripted transform
 * changes), plus its grey-box Three.js visuals. `archetype` is one of
 * `src/config/tuning.js`'s `ARCHETYPES` entries (data-model.md
 * ArchetypeConfig); `options.spawnPosition`/`options.color` let 002 spawn
 * more than one vehicle (player + seek-bot) distinctly.
 */
export function createVehicle(world, scene, archetype, options = {}) {
  const spawnPosition = options.spawnPosition ?? { x: 0, y: 2, z: 0 };
  const color = options.color ?? 0x2266dd;

  const { chassisHalfExtents, wheelRadius, suspensionRestLength } =
    VEHICLE_SHAPE;

  const chassisBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(
      spawnPosition.x,
      spawnPosition.y,
      spawnPosition.z,
    ),
  );
  const chassisCollider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      chassisHalfExtents.x,
      chassisHalfExtents.y,
      chassisHalfExtents.z,
    )
      .setMass(archetype.mass)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    chassisBody,
  );

  const controller = world.createVehicleController(chassisBody);

  WHEEL_DEFS.forEach((wheel) => {
    controller.addWheel(
      {
        x: wheel.x * VEHICLE_SHAPE.trackHalf,
        y: 0,
        z: wheel.z * VEHICLE_SHAPE.wheelBaseHalf,
      },
      SUSPENSION_DIRECTION,
      AXLE_DIRECTION,
      suspensionRestLength,
      wheelRadius,
    );
  });

  for (let i = 0; i < WHEEL_DEFS.length; i++) {
    controller.setWheelSuspensionStiffness(i, 24);
    controller.setWheelMaxSuspensionTravel(i, suspensionRestLength * 0.5);
    controller.setWheelFrictionSlip(i, 3.0);
  }
  applyTractionState(controller, WHEEL_DEFS.length, "normal");

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(
      chassisHalfExtents.x * 2,
      chassisHalfExtents.y * 2,
      chassisHalfExtents.z * 2,
    ),
    new THREE.MeshStandardMaterial({ color }),
  );
  scene.add(mesh);

  const wheelMeshes = WHEEL_DEFS.map(() => {
    const wheelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    scene.add(wheelMesh);
    return wheelMesh;
  });

  const vehicle = {
    chassisBody,
    chassisCollider,
    controller,
    mesh,
    wheelMeshes,
    wheelDefs: WHEEL_DEFS,
    tractionState: "normal",
    turbo: createTurboState(),
    archetype,
    hp: archetype.maxHp,
    eliminated: false,
    machineGunCooldownRemaining: 0,
    pickupWeapon: null,
    previousUsePickup: false,
    // Set by src/combat/oilSlick.js while overlapping an oil-slick segment
    // (research.md §6); 1 = no effect.
    oilSlickMultiplier: 1,
  };
  vehicle.syncMesh = () => syncMesh(vehicle);

  syncMesh(vehicle);

  return vehicle;
}

/**
 * Pure: engine force for this frame from the vehicle's archetype, throttle
 * input, and turbo multiplier (002-combat-system data-model.md
 * ArchetypeConfig) — extracted so archetype differentiation is testable
 * without a live physics world (research.md §11).
 */
export function computeEngineForce(archetype, moveAxisY, turboMultiplier) {
  return archetype.engineForce * moveAxisY * turboMultiplier;
}

/** Pure: steering angle for this frame from the vehicle's archetype and steer input. */
export function computeSteerAngle(archetype, moveAxisX) {
  return -archetype.maxSteerAngle * moveAxisX;
}

/**
 * Drive/steer/drift/turbo control step. Maps InputState.moveAxis to engine
 * force + steering (FR-002/FR-003), InputState.drift to the traction state
 * that governs side-friction (FR-004), and InputState.turbo to the
 * TurboState machine that temporarily scales engine force (FR-005/FR-006).
 * Enforces the vehicle's archetype maxSpeed (002-combat-system research.md
 * §7) and does nothing once the vehicle is eliminated.
 */
export function stepVehicleControl(vehicle, inputState, dt) {
  if (vehicle.eliminated) {
    vehicle.controller.updateVehicle(dt);
    return;
  }

  const { controller, wheelDefs, turbo, archetype } = vehicle;

  updateTurboState(turbo, inputState.turbo, dt, archetype);
  const turboMultiplier =
    turbo.status === "boosting" ? archetype.turboBoostMultiplier : 1;

  const engineForce = computeEngineForce(
    archetype,
    inputState.moveAxis.y,
    turboMultiplier,
  );
  const steerAngle = computeSteerAngle(archetype, inputState.moveAxis.x);

  const currentSpeed = controller.currentVehicleSpeed();
  vehicle.tractionState = computeTractionState(inputState.drift, currentSpeed);
  applyTractionState(
    controller,
    wheelDefs.length,
    vehicle.tractionState,
    vehicle.oilSlickMultiplier,
  );

  wheelDefs.forEach((wheel, i) => {
    controller.setWheelEngineForce(i, wheel.drive ? engineForce : 0);
    controller.setWheelSteering(i, wheel.steer ? steerAngle : 0);
    controller.setWheelBrake(i, 0);
  });

  controller.updateVehicle(dt);
  clampToMaxSpeed(vehicle);
}

/**
 * Applies damage from any combat source (ramming, machine gun, projectiles,
 * mines) to a vehicle's hp, marking it eliminated at hp <= 0 (FR-003,
 * data-model.md Vehicle.eliminated). Shared here so every damage source
 * uses the same elimination rule instead of duplicating it.
 */
export function applyDamage(vehicle, amount) {
  if (vehicle.eliminated) return;
  vehicle.hp = Math.max(0, vehicle.hp - amount);
  if (vehicle.hp <= 0) {
    vehicle.eliminated = true;
  }
}

function clampToMaxSpeed(vehicle) {
  const linvel = vehicle.chassisBody.linvel();
  const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
  const maxSpeed = vehicle.archetype.maxSpeed;
  if (speed > maxSpeed && speed > 0) {
    const scale = maxSpeed / speed;
    vehicle.chassisBody.setLinvel(
      { x: linvel.x * scale, y: linvel.y * scale, z: linvel.z * scale },
      true,
    );
  }
}

function syncMesh(vehicle) {
  const { chassisBody, controller, mesh, wheelMeshes } = vehicle;

  const t = chassisBody.translation();
  const r = chassisBody.rotation();
  mesh.position.set(t.x, t.y, t.z);
  mesh.quaternion.set(r.x, r.y, r.z, r.w);

  wheelMeshes.forEach((wheelMesh, i) => {
    const connection = controller.wheelChassisConnectionPointCs(i);
    if (!connection) return;
    const suspensionLength =
      controller.wheelSuspensionLength(i) ??
      VEHICLE_SHAPE.suspensionRestLength;
    const steerAngle = controller.wheelSteering(i) ?? 0;

    _wheelLocalOffset.set(
      connection.x,
      connection.y - suspensionLength,
      connection.z,
    );
    wheelMesh.position
      .copy(_wheelLocalOffset)
      .applyQuaternion(mesh.quaternion)
      .add(mesh.position);

    _steerQuat.setFromAxisAngle(_upAxis, steerAngle);
    wheelMesh.quaternion
      .copy(mesh.quaternion)
      .multiply(_steerQuat)
      .multiply(WHEEL_BASE_QUAT);
  });
}
