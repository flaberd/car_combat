import * as THREE from "three";
import { RAPIER } from "../physics/world.js";
import { TURBO, VEHICLE } from "../config/tuning.js";
import { applyTractionState, computeTractionState } from "./drift.js";
import { createTurboState, updateTurboState } from "./turbo.js";

// Front wheels steer, rear wheels drive — a conventional RWD layout.
// x/z are multipliers against VEHICLE.trackHalf/wheelBaseHalf.
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
 * Creates the player vehicle: a Rapier dynamic chassis driven entirely by
 * a DynamicRayCastVehicleController (Principle II/IX — no scripted
 * transform changes), plus its grey-box Three.js visuals.
 */
export function createVehicle(world, scene) {
  const {
    chassisHalfExtents,
    chassisMass,
    wheelRadius,
    suspensionRestLength,
  } = VEHICLE;

  const chassisBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 2, 0),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      chassisHalfExtents.x,
      chassisHalfExtents.y,
      chassisHalfExtents.z,
    ).setMass(chassisMass),
    chassisBody,
  );

  const controller = world.createVehicleController(chassisBody);

  WHEEL_DEFS.forEach((wheel) => {
    controller.addWheel(
      { x: wheel.x * VEHICLE.trackHalf, y: 0, z: wheel.z * VEHICLE.wheelBaseHalf },
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
    new THREE.MeshStandardMaterial({ color: 0x2266dd }),
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
    controller,
    mesh,
    wheelMeshes,
    wheelDefs: WHEEL_DEFS,
    tractionState: "normal",
    turbo: createTurboState(),
  };
  vehicle.syncMesh = () => syncMesh(vehicle);

  syncMesh(vehicle);

  return vehicle;
}

/**
 * Drive/steer/drift/turbo control step. Maps InputState.moveAxis to engine
 * force + steering (FR-002/FR-003), InputState.drift to the traction state
 * that governs side-friction (FR-004), and InputState.turbo to the
 * TurboState machine that temporarily scales engine force (FR-005/FR-006).
 */
export function stepVehicleControl(vehicle, inputState, dt) {
  const { controller, wheelDefs, turbo } = vehicle;

  updateTurboState(turbo, inputState.turbo, dt);
  const turboMultiplier =
    turbo.status === "boosting" ? TURBO.boostForceMultiplier : 1;

  const engineForce =
    VEHICLE.engineForce * inputState.moveAxis.y * turboMultiplier;
  const steerAngle = -VEHICLE.maxSteerAngle * inputState.moveAxis.x;

  const currentSpeed = controller.currentVehicleSpeed();
  vehicle.tractionState = computeTractionState(inputState.drift, currentSpeed);
  applyTractionState(controller, wheelDefs.length, vehicle.tractionState);

  wheelDefs.forEach((wheel, i) => {
    controller.setWheelEngineForce(i, wheel.drive ? engineForce : 0);
    controller.setWheelSteering(i, wheel.steer ? steerAngle : 0);
    controller.setWheelBrake(i, 0);
  });

  controller.updateVehicle(dt);
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
      controller.wheelSuspensionLength(i) ?? VEHICLE.suspensionRestLength;
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
