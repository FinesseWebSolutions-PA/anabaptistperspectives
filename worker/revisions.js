const json = (data,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

// Called only inside the existing administrator authorization boundary.
export async function revisionRoute(request, env, initial) {
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const segments=new URL(request.url).pathname.split('/');
  const id=segments[4], requested=segments[6];
  if(requested!==undefined) {
    const version=Number(requested);
    if(!Number.isSafeInteger(version)||version<0)return json({error:'Invalid revision'},400);
    if(version===0&&initial.has(id))return json({post:initial.get(id),version:0});
    const row=await env.DB.prepare('SELECT payload,version FROM post_revisions WHERE post_id=? AND version=? UNION ALL SELECT payload,version FROM posts WHERE id=? AND version=? LIMIT 1').bind(id,version,id,version).first();
    return row?json({post:JSON.parse(row.payload),version:row.version}):json({error:'Revision not found'},404);
  }
  const rows=(await env.DB.prepare('SELECT version,action,created_at FROM post_revisions WHERE post_id=? ORDER BY version DESC LIMIT 100').bind(id).all()).results;
  // Existing rows are immediately visible before their first post-upgrade edit.
  // The update trigger preserves this baseline atomically when the next edit occurs.
  const current=await env.DB.prepare('SELECT version,updated_at FROM posts WHERE id=?').bind(id).first();
  if(current&&!rows.some(row=>row.version===current.version))rows.unshift({version:current.version,action:'Current saved version',created_at:current.updated_at});
  if(initial.has(id))rows.push({version:0,action:'Original imported version',created_at:initial.get(id).date});
  return json({revisions:rows});
}
