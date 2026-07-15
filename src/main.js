import * as THREE from "three";
import { createPhysicsWorld, FIXED_TIMESTEP } from "./physics/world.js";
import { createArena } from "./arena/arena.js";
import { createFollowCamera } from "./camera/followCamera.js";
import { createKeyboardInput } from "./input/inputState.js";
import { createVehicle, stepVehicleControl } from "./vehicle/vehicle.js";

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
  const vehicle = createVehicle(world, scene);

  const keyboardInput = createKeyboardInput(window);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let physicsAccumulator = 0;
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const frameDelta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    const inputState = keyboardInput.read();

    physicsAccumulator += frameDelta;
    while (physicsAccumulator >= FIXED_TIMESTEP) {
      stepVehicleControl(vehicle, inputState, FIXED_TIMESTEP);
      world.step();
      physicsAccumulator -= FIXED_TIMESTEP;
    }

    vehicle.syncMesh();
    followCamera.update(frameDelta, vehicle.mesh.position, vehicle.mesh.quaternion);

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}

main();
