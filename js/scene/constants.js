// Shared measurements for the workshop. Units are meters.
export const SCREEN = {
  cssWidth: 1280,
  cssHeight: 960,
  width: 0.36,
  height: 0.27,
  // world position of the CRT screen surface centre (faces +z, toward the stool)
  center: { x: 0.1, y: 1.15, z: -0.13 },
};

// The phone propped on the bench. Its world transform comes from world.js.
export const PHONE = {
  cssWidth: 390,
  cssHeight: 844,
  width: 0.068,
  height: 0.147,
};

// On a phone visit the phone on the bench takes the shape of the visitor's
// own screen, so picking it up fills the viewport edge to edge.
export function fitPhoneToViewport(width, height) {
  const aspect = Math.min(0.62, Math.max(0.42, width / Math.max(1, height)));
  PHONE.cssWidth = 390;
  PHONE.cssHeight = Math.round(390 / aspect);
  PHONE.height = PHONE.width / aspect;
}

export const BENCH = { width: 2.4, depth: 0.8, height: 0.9, centerZ: -0.15 };
export const ROOM = { halfWidth: 2.6, backZ: -0.7, frontZ: 3.3, height: 2.7 };
export const CAMERA_FOV = 35;
// The CSS3D scene is scaled up so 1 m = 1000 px. At 1 m = 1 px the CSS camera
// plane sits a fraction of a pixel from the eye and Chrome's hit-testing of
// the OS DOM goes degenerate (clicks near the screen edge miss).
export const CSS_SCALE = 1000;

export const CAM = {
  loading: { position: [-3.2, 3.1, 4.7], target: [0.3, 0.5, 0] },
  idle: { center: [0.1, 0.95, -0.1], radius: 3.0, height: 2.0, target: [0.1, 0.95, -0.2] },
  desk: { position: [0.1, 1.42, 1.3], target: [0.1, 1.05, -0.2] },
  // On a phone the hero is the phone on its stand, so the walk-up frames it.
  deskPhone: { position: [-0.16, 1.3, 1.02], target: [-0.27, 0.95, 0.16] },
  orbit: { position: [-2.2, 1.9, 2.4], target: [0.1, 0.95, -0.1] },
};
