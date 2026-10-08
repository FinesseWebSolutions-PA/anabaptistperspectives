import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { limitRequestBody } from '../worker/limited-body.js';
import { publicPage, publicSummary } from '../worker/public-content.js';
import { revisionRoute } from '../worker/revisions.js';

test('unknown-length oversized requests are stopped and cancelled before parsing',async()=>{
  let cancelled=false;
  const stream=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(40));},cancel(){cancelled=true;}});
  const req=new Request('https://example.test/api/admin/media',{method:'POST',body:stream,duplex:'half'});
  await assert.rejects(limitRequestBody(req,100),/too large/);assert.ok(cancelled);
  const small=new Request('https://example.test/api/admin/posts',{method:'POST',body:'{"title":"Safe"}'});
  assert.deepEqual(await (await limitRequestBody(small,100)).json(),{title:'Safe'});
});

test('public DTOs strip internal fields and premium media and sanitize imported HTML',()=>{
  const premium={id:'private',path:'/private/',premium:true,body:'secret',bodyDoc:{},legacyHtml:'secret',version:99,status:'draft',youtube:'secret-video',image:'/media/private',file:'/media/secret'};
  const dto=publicSummary(premium);
  assert.equal(dto.file,'');assert.equal(dto.youtube,'');assert.equal(dto.image,'');
  for(const key of ['body','bodyDoc','legacyHtml','version','status'])assert.ok(!(key in dto));
  assert.equal(publicPage([premium],'/private/').articleHtml,'');
  const safe=publicPage([{id:'free',path:'/free/',legacyHtml:'<p onclick="bad()">Safe</p><script>bad()</script><iframe src="https://evil.example"></iframe>'}],'/free/').articleHtml;
  assert.ok(safe.includes('Safe'));assert.ok(!safe.includes('onclick'));assert.ok(!safe.includes('<script'));assert.ok(!safe.includes('evil.example'));
});

test('upgrading an existing database exposes and preserves its current version',async()=>{
  const db=new DatabaseSync(':memory:');
  try {
    db.exec(fs.readFileSync('drizzle/0000_watery_tiger_shark.sql','utf8'));
    db.prepare('INSERT INTO posts (id,payload,live_payload,version,created_at,updated_at) VALUES (?,?,?,?,?,?)').run('old',JSON.stringify({body:'existing draft'}),JSON.stringify({body:'existing published'}),8,'2026-10-01','2026-10-01');
    db.exec(fs.readFileSync('drizzle/0002_smart_vermin.sql','utf8'));
    const env={DB:{prepare(sql){
      return {bind(...args){return {
        async first(){return db.prepare(sql).get(...args)||null;},
        async all(){return {results:db.prepare(sql).all(...args)};},
      };}};
    }}};
    let response=await revisionRoute(new Request('https://example.test/api/admin/posts/old/revisions'),env,new Map());
    assert.equal((await response.json()).revisions[0].version,8);
    response=await revisionRoute(new Request('https://example.test/api/admin/posts/old/revisions/8'),env,new Map());
    assert.equal((await response.json()).post.body,'existing draft');
    db.prepare('UPDATE posts SET payload=?,version=9,updated_at=? WHERE id=?').run(JSON.stringify({body:'new draft'}),'2026-10-08','old');
    assert.equal(JSON.parse(db.prepare('SELECT payload FROM post_revisions WHERE post_id=? AND version=?').get('old',8).payload).body,'existing draft');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM post_revisions').get().n,2);
  } finally {db.close();}
});
