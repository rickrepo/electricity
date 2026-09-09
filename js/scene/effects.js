// Shader-based effects: wisps of smoke/steam and a full-screen film grain.
import * as THREE from '../../vendor/three.min.js';

const NOISE_GLSL = `
  float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i); float b = hash21(i + vec2(1.0, 0.0)); float c = hash21(i + vec2(0.0, 1.0)); float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.1; a *= 0.5; } return v; }
`;

export function createWisp({ width = 0.06, height = 0.22, color = '#d8d8d8', speed = 0.5, strength = 0.5 } = {}) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSpeed: { value: speed }, uStrength: { value: strength } },
    vertexShader: `
      uniform float uTime; uniform float uSpeed; varying vec2 vUv; ${NOISE_GLSL}
      void main() {
        vUv = uv; vec3 p = position;
        p.x += (vnoise(vec2(uv.y * 3.0, uTime * 0.35 * uSpeed)) - 0.5) * 0.03 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform float uSpeed; uniform float uStrength; varying vec2 vUv; ${NOISE_GLSL}
      void main() {
        vec2 uv = vUv * vec2(2.5, 5.0); uv.y -= uTime * 0.6 * uSpeed;
        float n = fbm(uv);
        float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        float fade = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
        float a = smoothstep(0.42, 0.75, n) * edge * fade * uStrength;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 8), material);
  mesh.renderOrder = 5;
  return {
    mesh,
    update(elapsed) { material.uniforms.uTime.value = elapsed; },
    setStrength(v) { material.uniforms.uStrength.value = v; },
    get strength() { return material.uniforms.uStrength.value; },
  };
}

export function createGrain(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0.06 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uAmount; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
      void main() { float n = hash(gl_FragCoord.xy * 0.5); gl_FragColor = vec4(vec3(n), uAmount * (0.5 + 0.5 * n)); }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return {
    render(elapsed) {
      material.uniforms.uTime.value = elapsed % 1000;
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = autoClear;
    },
    setAmount(v) { material.uniforms.uAmount.value = v; },
  };
}
