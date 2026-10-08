// Optional one-time migration from the previous static generator; not used by builds.
import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
const source=process.argv[2];
if(!source)throw new Error('Supply the original source checkout path.');
const assets=JSON.parse(fs.readFileSync(path.join(source,'worker/generated-assets.json'),'utf8'));
fs.mkdirSync('worker/templates',{recursive:true});
for(const name of ['index.html','404.html','sitemap.xml'])fs.writeFileSync('worker/templates/'+name,gunzipSync(Buffer.from(assets['/'+name],'base64')));
fs.copyFileSync(path.join(source,'worker/generated-catalog.json'),'worker/catalog.json');
