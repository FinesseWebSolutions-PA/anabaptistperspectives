import {test} from 'node:test';
import assert from 'node:assert/strict';
import {origin,editorEmail,password,setupToken,authRequest,login} from './helpers.mjs';

const rejected=response=>assert.ok([400,401,403,404,409,410,422].includes(response.status),`Expected a denied request, received ${response.status}.`);
const privatePosts=cookie=>fetch(origin+'/api/admin/posts',{headers:cookie?{cookie}:{}});

test('password setup, sessions, CSRF, and single-use recovery protect the studio',async()=>{
  assert.ok(setupToken,'Set TEST_SETUP_TOKEN for a fresh local database.');
  assert.equal((await privatePosts()).status,401);
  assert.equal((await fetch(origin+'/api/admin/posts',{headers:{'oai-authenticated-user-id':'test-editor','oai-authenticated-user-email':editorEmail}})).status,401,'Old identity headers must no longer grant access.');
  assert.equal((await privatePosts('better-auth.session_token=forged')).status,401);
  const page=await fetch(origin+'/admin/');
  assert.equal(page.status,200);
  assert.match(page.headers.get('cache-control'),/no-store/);

  rejected(await authRequest('setup-info',undefined,{headers:{authorization:'Bearer invalid-grant'}}));
  let response=await authRequest('setup-info',undefined,{headers:{authorization:'Bearer '+setupToken}});
  assert.equal(response.status,200);
  assert.equal((await response.json()).email,editorEmail);
  assert.equal((await authRequest('setup',{token:setupToken,password},{headers:{origin:'https://other.example'}})).status,403);
  response=await authRequest('setup',{token:setupToken,password});
  assert.equal(response.status,200);
  let {recoveryCode}=await response.json();
  assert.ok(typeof recoveryCode==='string'&&recoveryCode.replace(/[^a-zA-Z0-9]/g,'').length>=24,'Recovery needs a high-entropy code.');
  const firstCode=recoveryCode;
  rejected(await authRequest('setup',{token:setupToken,password:password+'-replay'}));
  rejected(await authRequest('setup-info',undefined,{headers:{authorization:'Bearer '+setupToken}}));
  rejected(await authRequest('sign-up/email',{email:'uninvited@example.test',password,name:'Uninvited'}));
  assert.equal((await authRequest('sign-in/email',{email:editorEmail,password},{headers:{origin:'https://other.example'}})).status,403);
  rejected(await authRequest('sign-in/email',{email:editorEmail,password:password+'-wrong'},{ip:'198.51.100.22'}));
  rejected(await authRequest('sign-in/email',{email:'uninvited@example.test',password},{ip:'198.51.100.23'}));

  const session=await login();
  assert.equal((await privatePosts(session)).status,200);
  const me=await fetch(origin+'/api/admin/me',{headers:{cookie:session}});
  assert.equal((await me.json()).email,editorEmail);
  assert.equal((await fetch(origin+'/api/admin/posts',{method:'POST',headers:{cookie:session,origin:'https://other.example','content-type':'application/json'},body:JSON.stringify({title:'Must never be saved'})})).status,403);
  assert.equal((await authRequest('sign-out',{}, {cookie:session,headers:{origin:'https://other.example'}})).status,403);
  assert.equal((await privatePosts(session)).status,200,'Cross-site sign-out must not revoke the valid session.');
  response=await authRequest('sign-out',{}, {cookie:session});
  assert.equal(response.status,200);
  assert.equal((await privatePosts(session)).status,401,'Logout must revoke the server session, not just clear a cookie.');

  const oldSession=await login(password,'198.51.100.24');
  const replacement=password+'-changed';
  rejected(await authRequest('recover',{email:editorEmail,recoveryCode:'wrong-recovery-code',newPassword:replacement},{ip:'198.51.100.25'}));
  rejected(await authRequest('recover',{email:'uninvited@example.test',recoveryCode,newPassword:replacement},{ip:'198.51.100.26'}));
  assert.equal((await authRequest('recover',{email:editorEmail,recoveryCode,newPassword:replacement},{headers:{origin:'https://other.example'}})).status,403);
  rejected(await authRequest('recover',{email:editorEmail,recoveryCode,newPassword:'short'},{ip:'198.51.100.27'}));
  const competingResets=await Promise.all([
    authRequest('recover',{email:editorEmail,recoveryCode,newPassword:replacement},{ip:'198.51.100.28'}),
    authRequest('recover',{email:editorEmail,recoveryCode,newPassword:replacement},{ip:'198.51.100.31'}),
  ]);
  assert.deepEqual(competingResets.map(r=>r.status).sort(),[200,401],'Concurrent use of one recovery code must permit exactly one reset.');
  response=competingResets.find(r=>r.status===200);
  recoveryCode=(await response.json()).recoveryCode;
  assert.ok(recoveryCode&&recoveryCode!==firstCode,'Successful recovery must rotate the recovery code.');
  assert.equal((await privatePosts(oldSession)).status,401,'Password recovery must revoke previous sessions.');
  rejected(await authRequest('sign-in/email',{email:editorEmail,password},{ip:'198.51.100.29'}));
  const recoveredSession=await login(replacement,'198.51.100.30');
  assert.equal((await privatePosts(recoveredSession)).status,200);

  // Restore the shared ephemeral fixture password for the content lifecycle suite.
  response=await authRequest('recover',{email:editorEmail,recoveryCode,newPassword:password},{ip:'198.51.100.32'});
  assert.equal(response.status,200);
  assert.notEqual((await response.json()).recoveryCode,recoveryCode);
  assert.equal((await privatePosts(recoveredSession)).status,401);
  assert.equal((await privatePosts(await login(password,'198.51.100.33'))).status,200);
});

test('authentication throttles repeated failed sign-ins',async()=>{
  let limited=false;
  for(let attempt=0;attempt<15;attempt++){
    const response=await authRequest('sign-in/email',{email:'limiter-fixture@example.test',password:password+'-wrong'},{ip:'198.51.100.99'});
    if(response.status===429){limited=true;break;}
    rejected(response);
  }
  assert.ok(limited,'Repeated authentication attempts must receive HTTP 429.');
});
