import fs from 'node:fs';import path from 'node:path';import {gzipSync} from 'node:zlib';import {build} from 'esbuild';
const files={};function scan(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){if(['server','.openai'].includes(f.name))continue;const p=path.join(dir,f.name);if(f.isDirectory())scan(p);else{const name='/'+path.relative('dist',p);files[name]=gzipSync(fs.readFileSync(p)).toString('base64');}}}scan('dist');
const client=await build({entryPoints:['admin/admin.js'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});
files['/admin/admin.js']=gzipSync(client.outputFiles[0].contents).toString('base64');
for(const f of ['index.html','admin.css','rich-editor.css','login.html','login.css','login.js'])files['/admin/'+f]=gzipSync(fs.readFileSync('admin/'+f)).toString('base64');
fs.writeFileSync('worker/generated-assets.json',JSON.stringify(files));
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,external:['node:*']});
fs.mkdirSync('dist/.openai',{recursive:true});fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');console.log('Worker bundle:',(fs.statSync('dist/server/index.js').size/1024/1024).toFixed(2),'MB');

// Only the Worker is deployed; it owns routing and all protected/static responses.
for(const f of fs.readdirSync('dist'))if(!['server','.openai'].includes(f))fs.rmSync(path.join('dist',f),{recursive:true,force:true});
