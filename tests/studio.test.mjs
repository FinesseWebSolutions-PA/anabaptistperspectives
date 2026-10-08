import {test} from 'node:test';import assert from 'node:assert/strict';
import {origin,api,studioCookie} from './helpers.mjs';
test('publishing lifecycle, persistence, authorization, conflict protection, media privacy',async()=>{
 assert.equal((await fetch(origin+'/api/admin/posts')).status,401);
 assert.equal((await api('/api/admin/posts',null,{cookie:'better-auth.session_token=forged'})).status,401);
 assert.equal((await api('/api/admin/posts',{title:'Blocked'},{origin:'https://other.example'})).status,403);
 let p={type:'essay',title:'Studio verification '+Date.now(),excerpt:'A saved test summary.',body:'## A heading\n\nA **meaningful** paragraph. <script>alert(1)</script>',topics:['History'],date:'2026-10-08'};
 let r=await api('/api/admin/posts',p);assert.equal(r.status,200);p=(await r.json()).post;assert.ok(p.id);assert.equal(p.status,'draft');
 assert.equal((await fetch(origin+p.path)).status,404);
 assert.equal((await fetch(origin+'/admin/preview/'+p.id)).status,200);assert.ok(!(await (await fetch(origin+'/admin/preview/'+p.id)).text()).includes(p.title));
 const loaded=(await (await api('/api/admin/posts')).json()).posts.find(x=>x.id===p.id);assert.equal(loaded.body,p.body);
 r=await api('/api/admin/posts',{...p,action:'publish'});assert.equal(r.status,200);p=(await r.json()).post;
 let live=await (await fetch(origin+p.path)).text();assert.ok(live.includes(p.title));assert.ok(live.includes('<strong>meaningful</strong>'));assert.ok(!live.includes('<script>alert(1)</script>'));
 const version=p.version;r=await api('/api/admin/posts',{...p,body:'A private replacement draft.'});p=(await r.json()).post;assert.ok(p.hasDraft);
 live=await (await fetch(origin+p.path)).text();assert.ok(!live.includes('A private replacement draft.'));
 assert.equal((await api('/api/admin/posts',{...p,version})).status,409);
 assert.ok((await (await fetch(origin+'/essays/')).text()).includes(p.title));
 const upload=new FormData();upload.append('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKXcAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'test.png');
 r=await fetch(origin+'/api/admin/media',{method:'POST',headers:{origin,cookie:await studioCookie()},body:upload});assert.equal(r.status,201);const media=await r.json();assert.equal((await fetch(origin+media.url)).status,404);assert.equal((await api(media.url)).status,200);
 r=await api('/api/admin/posts',{...p,image:media.url,action:'publish'});p=(await r.json()).post;assert.equal((await fetch(origin+media.url)).status,200);
 r=await api('/api/admin/posts',{...p,action:'unpublish'});p=(await r.json()).post;assert.equal(p.status,'draft');assert.equal((await fetch(origin+p.path)).status,404);assert.equal((await fetch(origin+media.url)).status,404);assert.ok(!(await (await fetch(origin+'/essays/')).text()).includes(p.title));
 const bad=new FormData();bad.append('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/png'}),'bad.png');assert.equal((await fetch(origin+'/api/admin/media',{method:'POST',headers:{origin,cookie:await studioCookie()},body:bad})).status,400);
});
test('new episodes update the homepage and existing drafts preserve their public revision',async()=>{
 const existing=(await (await api('/api/admin/posts')).json()).posts.find(p=>p.id.startsWith('legacy-')&&p.type==='essay');const before=await (await fetch(origin+existing.path)).text();
 let r=await api('/api/admin/posts',{...existing,title:existing.title+' [private edit]',action:'save'});assert.equal(r.status,200);const unchanged=await (await fetch(origin+existing.path)).text();assert.ok(!unchanged.includes('[private edit]'));assert.ok(unchanged.includes(existing.legacyHtml));
 let p={type:'episode',title:'Studio newest episode '+Date.now(),excerpt:'A test conversation.',body:'Test notes.',youtube:'https://youtu.be/nmbyBDYf_EM',date:'2026-10-09',topics:['History']};r=await api('/api/admin/posts',{...p,action:'publish'});assert.equal(r.status,200);p=(await r.json()).post;
 const home=await (await fetch(origin+'/')).text();assert.ok(home.includes(p.title));assert.ok(home.includes('aria-label="Play video: '+p.title+'"'));
 assert.ok((await (await fetch(origin+'/sitemap.xml')).text()).includes(p.path));
 await api('/api/admin/posts',{...p,action:'unpublish'});assert.ok(!(await (await fetch(origin+'/sitemap.xml')).text()).includes(p.path));
 assert.equal((await fetch(origin+'/origins/locations/')).status,200);
});

test('rich-text documents persist and publish safely without exposing subsequent draft edits',async()=>{
 const bodyDoc={type:'doc',content:[
  {type:'heading',attrs:{level:2,textAlign:'center'},content:[{type:'text',text:'Rich document heading'}]},
  {type:'paragraph',content:[{type:'text',text:'A lasting conviction',marks:[{type:'bold'},{type:'italic'}]},{type:'text',text:' is lived out. '},{type:'text',text:'Read the source',marks:[{type:'link',attrs:{href:'https://example.com/story?one=1&two=2'}}]}]},
  {type:'orderedList',attrs:{start:3},content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'A practical response'}]}]}]},
  {type:'paragraph',content:[{type:'text',text:'<script>alert("draft text")</script>'}]},
  {type:'image',attrs:{src:'https://example.com/cover.jpg',alt:'A historic church'}},
 ]};
 let p;
 try{
  let r=await api('/api/admin/posts',{type:'essay',title:'Rich text lifecycle '+Date.now(),excerpt:'Formatting survives every step.',date:'2026-10-08',topics:['History'],bodyDoc});
  assert.equal(r.status,200);p=(await r.json()).post;
  const savedDoc=p.bodyDoc;
  assert.ok(p.body.includes('A lasting conviction is lived out.'));
  assert.equal((await fetch(origin+p.path)).status,404);
  const loaded=(await (await api('/api/admin/posts')).json()).posts.find(post=>post.id===p.id);
  assert.deepEqual(loaded.bodyDoc,savedDoc,'Reopening a saved draft must retain its document tree.');
  r=await api('/api/admin/posts',{...p,action:'publish'});assert.equal(r.status,200);p=(await r.json()).post;
  const live=await (await fetch(origin+p.path)).text();
  assert.ok(live.includes('<h2 style="text-align:center">Rich document heading</h2>'));
  assert.ok(live.includes('<em><strong>A lasting conviction</strong></em>'));
  assert.ok(live.includes('<ol start="3"><li><p>A practical response</p></li></ol>'));
  assert.ok(live.includes('href="https://example.com/story?one=1&amp;two=2"'));
  assert.ok(live.includes('src="https://example.com/cover.jpg" alt="A historic church"'));
  assert.match(live,/&lt;script&gt;alert\((?:&quot;|")draft text(?:&quot;|")\)&lt;\/script&gt;/);
  assert.ok(!live.includes('<script>alert("draft text")</script>'));
  const updatedDoc=structuredClone(savedDoc);
  updatedDoc.content[0].content[0].text='A private rich-text revision';
  r=await api('/api/admin/posts',{...p,bodyDoc:updatedDoc});assert.equal(r.status,200);p=(await r.json()).post;
  assert.ok(p.hasDraft);
  const afterDraft=await (await fetch(origin+p.path)).text();
  assert.equal(afterDraft.match(/<main\b[\s\S]*?<\/main>/)?.[0],live.match(/<main\b[\s\S]*?<\/main>/)?.[0],'Saving a formatted draft must leave published page content unchanged; hydration timestamps may differ.');
  assert.ok(!afterDraft.includes('A private rich-text revision'),'Neither HTML nor hydration data may expose drafts.');
  const metadataOnly={...p,title:p.title+' revised'};delete metadataOnly.bodyDoc;delete metadataOnly.body;
  r=await api('/api/admin/posts',metadataOnly);assert.equal(r.status,200);p=(await r.json()).post;
  assert.deepEqual(p.bodyDoc,updatedDoc,'A client changing only metadata must not lose rich formatting.');
  const malformed=structuredClone(updatedDoc);
  malformed.content.push({type:'paragraph',content:[{type:'text',text:'Unsafe link',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]});
  assert.equal((await api('/api/admin/posts',{...p,bodyDoc:malformed})).status,400);
  const afterRejected=(await (await api('/api/admin/posts')).json()).posts.find(post=>post.id===p.id);
  assert.deepEqual(afterRejected.bodyDoc,updatedDoc,'A rejected document must leave the saved draft intact.');
  assert.equal(afterRejected.version,p.version);
 }finally{
  if(p?.id){const cleanup=await api('/api/admin/posts',{...p,action:'unpublish'});assert.equal(cleanup.status,200);}
 }
});
