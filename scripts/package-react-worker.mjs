import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { builtinModules } from 'node:module';

// The hosted worker has the existing DB/BUCKET bindings; static files travel with it.
const mime = { '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8', '.woff2':'font/woff2' };
const assets = {};
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else assets['/' + path.relative('dist/client', file).split(path.sep).join('/')] = { type: mime[path.extname(file)] || 'application/octet-stream', data: gzipSync(fs.readFileSync(file)).toString('base64') };
  }
}
visit('dist/client');
fs.writeFileSync('worker/generated-client-assets.json', JSON.stringify(assets));
const result = await build({ entryPoints: ['worker/deploy.js'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', minify: true, external: ['node:*', 'cloudflare:*'], plugins: [{ name: 'worker-node-builtins', setup(bundler) { bundler.onResolve({ filter: /.*/ }, args => builtinModules.includes(args.path) ? { path: args.path.startsWith('node:') ? args.path : 'node:' + args.path, external: true } : undefined); } }] });
fs.writeFileSync('dist/server/index.js', result.outputFiles[0].contents);
// The Cloudflare Vite plugin copies local development variables; never ship them.
fs.rmSync('dist/server/.dev.vars', { force: true });
fs.mkdirSync('dist/.openai', { recursive: true });
fs.copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log(`Packaged React worker with ${Object.keys(assets).length} static assets.`);
