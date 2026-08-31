import * as THREE from "three";
import { RAPIER } from "../physics/world.js";

// Grey-box arena: a flat driveable ground plane contained by 4 boundary
// walls. Primitive geometry only — no .glb assets needed for grey-box
// visuals (see research.md §3).
const ARENA_SIZE = 100;
const WALL_HEIGHT = 4;
const WALL_THICKNESS = 1;
const CHECKER_TILE_SIZE = 4; // meters per checkerboard square

// Procedural checkerboard texture (research/UX test: a flat single-color
// ground gives no visual reference for speed or turning — a tiled pattern
// lets the driver actually see motion against the ground).
function createCheckerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#5c5c5c";
  ctx.fillRect(0, 0, 2, 2);
  ctx.fillStyle = "#383838";
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillRect(0, 1, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.repeat.set(
    ARENA_SIZE / CHECKER_TILE_SIZE,
    ARENA_SIZE / CHECKER_TILE_SIZE,
  );
  return texture;
}

const GROUND_MATERIAL = new THREE.MeshStandardMaterial({
  map: createCheckerTexture(),
});
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
