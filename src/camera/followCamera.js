import * as THREE from "three";
import { CAMERA } from "../config/tuning.js";

// Damped third-person follow camera (research.md §4): the camera never
// snaps rigidly to the tracked body's transform, it eases toward an
// offset target each frame so physics jitter/rotation isn't felt directly.
const _offset = new THREE.Vector3();
const _desiredPosition = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3();

export function createFollowCamera(camera) {
  return {
    update(deltaSeconds, targetPosition, targetQuaternion) {
      _offset
        .set(CAMERA.offset.x, CAMERA.offset.y, CAMERA.offset.z)
        .applyQuaternion(targetQuaternion);
      _desiredPosition.copy(targetPosition).add(_offset);

      // Frame-rate independent exponential damping.
      const lerpFactor = 1 - Math.exp(-CAMERA.followLerp * deltaSeconds);
      camera.position.lerp(_desiredPosition, lerpFactor);

      _lookAtTarget
        .set(CAMERA.lookAtOffset.x, CAMERA.lookAtOffset.y, CAMERA.lookAtOffset.z)
        .applyQuaternion(targetQuaternion)
        .add(targetPosition);
      camera.lookAt(_lookAtTarget);
    },
  };
}
