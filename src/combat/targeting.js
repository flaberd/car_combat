import * as THREE from "three";

const MARKER_RADIUS = 1.3;
const MARKER_TUBE_RADIUS = 0.15;
const MARKER_Y_OFFSET = 2.2; // above the target vehicle's chassis
const MARKER_SPIN_SPEED = 2.4; // radians/sec, purely cosmetic
const MARKER_COLOR = 0xff3333;

/**
 * Pure: finds the best (nearest) valid target for a targeting query —
 * shared by any weapon that needs to auto-select a target, not just homing
 * rockets (spec.md request: "система пошуку цілі" reusable across
 * targeting-capable weapons). `candidates` are Vehicle-shaped objects
 * (need only `.eliminated` and `.chassisBody.translation()`); the caller
 * excludes the searching vehicle itself.
 *
 * `radius` limits search distance (world units). `coneDegrees` restricts
 * the search to an angular cone centered on `originForwardXZ` (a
 * normalized {x,z} facing vector) — 360 means omnidirectional, no
 * directional restriction at all, which is what homing rockets use since
 * the projectile launches upward and curves to its target regardless of
 * which way the vehicle is currently facing.
 */
export function findBestTarget(
  originPosition,
  originForwardXZ,
  candidates,
  { radius, coneDegrees },
) {
  let best = null;
  let bestDistSq = Infinity;

  for (const candidate of candidates) {
    if (!candidate || candidate.eliminated) continue;

    const pos = candidate.chassisBody.translation();
    const dx = pos.x - originPosition.x;
    const dz = pos.z - originPosition.z;
    const distSq = dx * dx + dz * dz;
    if (distSq > radius * radius) continue;

    if (coneDegrees < 360 && distSq > 1e-9) {
      const distLen = Math.sqrt(distSq);
      const dot = (dx / distLen) * originForwardXZ.x + (dz / distLen) * originForwardXZ.z;
      const angleDeg = (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
      if (angleDeg > coneDegrees / 2) continue;
    }

    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = candidate;
    }
  }

  return best;
}

/** Creates the (initially hidden) 3D target-lock marker, added once to the scene. */
export function createTargetMarker(scene) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(MARKER_RADIUS, MARKER_TUBE_RADIUS, 8, 24),
    new THREE.MeshStandardMaterial({
      color: MARKER_COLOR,
      emissive: MARKER_COLOR,
      emissiveIntensity: 0.6,
    }),
  );
  mesh.rotation.x = Math.PI / 2; // lie flat, like a ring hovering over the target
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

/** Repositions the marker over `target` and shows it, or hides it when `target` is null. */
export function updateTargetMarker(markerMesh, target, dt) {
  if (!target) {
    markerMesh.visible = false;
    return;
  }

  const pos = target.chassisBody.translation();
  markerMesh.position.set(pos.x, pos.y + MARKER_Y_OFFSET, pos.z);
  markerMesh.rotation.z += dt * MARKER_SPIN_SPEED;
  markerMesh.visible = true;
}
