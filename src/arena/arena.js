import * as THREE from "three";
import { RAPIER } from "../physics/world.js";

// Grey-box arena: a flat driveable ground plane contained by 4 boundary
// walls. Primitive geometry only — no .glb assets needed for grey-box
// visuals (see research.md §3).
const ARENA_SIZE = 100;
const WALL_HEIGHT = 4;
const WALL_THICKNESS = 1;

const GROUND_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x555555 });
const WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x777777 });

export function createArena(world, scene) {
  const group = new THREE.Group();
  scene.add(group);

  // Ground
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(ARENA_SIZE / 2, 0.5, ARENA_SIZE / 2).setTranslation(
      0,
      -0.5,
      0,
    ),
    groundBody,
  );

  const groundMesh = new THREE.Mesh(
    new THREE.BoxGeometry(ARENA_SIZE, 1, ARENA_SIZE),
    GROUND_MATERIAL,
  );
  groundMesh.position.set(0, -0.5, 0);
  group.add(groundMesh);

  // Boundary walls (north, south, east, west)
  const half = ARENA_SIZE / 2;
  const wallSpecs = [
    { x: 0, z: -half, w: ARENA_SIZE, d: WALL_THICKNESS }, // north
    { x: 0, z: half, w: ARENA_SIZE, d: WALL_THICKNESS }, // south
    { x: -half, z: 0, w: WALL_THICKNESS, d: ARENA_SIZE }, // west
    { x: half, z: 0, w: WALL_THICKNESS, d: ARENA_SIZE }, // east
  ];

  const boundaryBodies = wallSpecs.map(({ x, z, w, d }) => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(x, WALL_HEIGHT / 2, z),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(w / 2, WALL_HEIGHT / 2, d / 2),
      body,
    );

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, WALL_HEIGHT, d),
      WALL_MATERIAL,
    );
    mesh.position.set(x, WALL_HEIGHT / 2, z);
    group.add(mesh);

    return body;
  });

  return { groundBody, boundaryBodies, group, size: ARENA_SIZE };
}
