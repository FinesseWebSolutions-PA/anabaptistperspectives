import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Preserve the existing CMS document previews and authentication assets.
const assets = {};
for (const file of ['index.html','404.html','sitemap.xml']) assets['/'+file] = gzipSync(fs.readFileSync('worker/templates/'+file)).toString('base64');
assets['/assets/style.css'] = gzipSync(fs.readFileSync('public/assets/style.css')).toString('base64');
const client = await build({ entryPoints: ['admin/admin.js'], bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022', minify: true });
assets['/admin/admin.js'] = gzipSync(client.outputFiles[0].contents).toString('base64');
for (const file of ['index.html', 'admin.css', 'rich-editor.css', 'login.html', 'login.css', 'login.js']) {
  assets['/admin/' + file] = gzipSync(fs.readFileSync('admin/' + file)).toString('base64');
}
fs.writeFileSync('worker/generated-assets.json', JSON.stringify(assets));
