import RAPIER from "@dimforge/rapier3d-compat";

// Fixed physics timestep (60 Hz) decoupled from render rate.
export const FIXED_TIMESTEP = 1 / 60;

export async function createPhysicsWorld() {
  await RAPIER.init();

  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const world = new RAPIER.World(gravity);
  world.timestep = FIXED_TIMESTEP;

  return world;
}

export { RAPIER };
