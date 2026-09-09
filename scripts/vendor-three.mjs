// Bundles three.js (plus the two addons this site uses) into a single
// minified ES module at vendor/three.min.js, so the site can be served as
// plain static files with no build step.
//
//   npm install
//   npm run vendor
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../node_modules/three/package.json', import.meta.url)));
mkdirSync(new URL('../vendor/', import.meta.url), { recursive: true });

await build({
  stdin: {
    contents: `
      export * from 'three';
      export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
      export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
    `,
    resolveDir: new URL('..', import.meta.url).pathname,
  },
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  legalComments: 'none',
  banner: { js: `/* three.js r${pkg.version} (MIT) - https://github.com/mrdoob/three.js - bundled with OrbitControls + RoomEnvironment */` },
  outfile: new URL('../vendor/three.min.js', import.meta.url).pathname,
});

writeFileSync(new URL('../vendor/VERSION', import.meta.url), `three ${pkg.version}\n`);
console.log(`vendored three ${pkg.version} -> vendor/three.min.js`);
