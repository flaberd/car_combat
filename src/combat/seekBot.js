import * as THREE from "three";
import { WEAPONS } from "../config/tuning.js";

const STEER_GAIN = 1.4;
const FIRE_CONE_RADIANS = (20 * Math.PI) / 180;

/**
 * Pure: signed steering input (data-model.md SeekBot) toward a target,
 * given the bot's forward direction and the horizontal (x/z) vector to the
 * target, both already normalized-agnostic (this function normalizes the
 * target vector itself). Returns `{ steer, angleDiff }` — `steer` is
 * clamped to [-1, 1] for direct use as `InputState.moveAxis.x`;
 * `angleDiff` (radians) is exposed for fire-cone checks.
 */
export function computeSeekSteering(toTargetX, toTargetZ, forwardX, forwardZ) {
  const toTargetLen = Math.hypot(toTargetX, toTargetZ);
  if (toTargetLen < 1e-6) return { steer: 0, angleDiff: 0 };

  const tx = toTargetX / toTargetLen;
  const tz = toTargetZ / toTargetLen;
  const dot = forwardX * tx + forwardZ * tz;
  const cross = forwardX * tz - forwardZ * tx;
  const angleDiff = Math.atan2(cross, dot);
  const steer = Math.max(-1, Math.min(1, -angleDiff * STEER_GAIN));

  return { steer, angleDiff };
}

/**
 * Minimal opponent AI (research.md §10): reuses the player's own
 * Vehicle/stepVehicleControl. Each frame produces an InputState that steers
 * toward the target, drives forward at full throttle, and fires the
 * machine gun when roughly facing the target within range. No drift,
 * turbo, or pickup-weapon use in this slice.
 */
export function createSeekBot(vehicle, targetVehicle) {
  const _forward = new THREE.Vector3();

  return {
    computeInputState() {
      if (vehicle.eliminated || targetVehicle.eliminated) {
        return {
          moveAxis: { x: 0, y: 0 },
          aimAxis: { x: 0, y: 0 },
          drift: false,
          turbo: false,
          fire: false,
          usePickup: false,
        };
      }

      const botPos = vehicle.chassisBody.translation();
      const targetPos = targetVehicle.chassisBody.translation();

      _forward.set(0, 0, 1).applyQuaternion(vehicle.mesh.quaternion);

      const { steer, angleDiff } = computeSeekSteering(
        targetPos.x - botPos.x,
        targetPos.z - botPos.z,
        _forward.x,
        _forward.z,
      );

      const distance = Math.hypot(
        targetPos.x - botPos.x,
        targetPos.z - botPos.z,
      );
      const facingTarget = Math.abs(angleDiff) <= FIRE_CONE_RADIANS;
      const inRange = distance <= WEAPONS.machineGun.range;

      return {
        moveAxis: { x: steer, y: 1 },
        aimAxis: { x: 0, y: 0 },
        drift: false,
        turbo: false,
        fire: facingTarget && inRange,
        usePickup: false,
      };
    },
  };
}
