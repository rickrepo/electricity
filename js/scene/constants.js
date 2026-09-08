// Shared measurements for the 3D room. Units are meters.
export const SCREEN = {
  cssWidth: 1280,
  cssHeight: 960,
  width: 0.36,
  height: 0.27,
  // world position of the screen surface centre (faces +z, toward the chair)
  center: { x: 0, y: 0.99, z: -0.135 },
};

export const DESK = { width: 1.8, depth: 0.75, height: 0.74, centerZ: -0.2 };

export const ROOM = { halfWidth: 2.6, backZ: -0.7, frontZ: 3.3, height: 2.7 };

export const CAMERA_FOV = 35;
