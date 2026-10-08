import assert from 'node:assert/strict';

export const origin=process.env.TEST_ORIGIN||'http://localhost:4180';
const host=new URL(origin).hostname;
assert.ok(['localhost','127.0.0.1','[::1]'].includes(host),'Integration tests must run against a local disposable database.');
export const editorEmail=process.env.TEST_ADMIN_EMAIL||'editor@example.test';
export const password=process.env.TEST_ADMIN_PASSWORD;
assert.ok(password&&password.length>=12,'Set TEST_ADMIN_PASSWORD to an ephemeral test password.');
export const setupToken=process.env.TEST_SETUP_TOKEN;

export function cookieFrom(response){
  const values=response.headers.getSetCookie();
  return values.map(value=>value.split(';',1)[0]).filter(value=>!value.endsWith('=')).join('; ');
}

export async function authRequest(path,body,{cookie='',ip='198.51.100.20',headers={}}={}){
  return fetch(origin+'/api/auth/'+path,{
    method:body===undefined?'GET':'POST',
    headers:{origin,'content-type':'application/json','cf-connecting-ip':ip,...(cookie?{cookie}:{}),...headers},
    body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',
  });
}

export async function login(pass=password,ip='198.51.100.21'){
  const response=await authRequest('sign-in/email',{email:editorEmail,password:pass},{ip});
  assert.equal(response.status,200,'The fixture administrator must be able to sign in.');
  const cookie=cookieFrom(response);
  assert.ok(cookie,'Signing in must issue a session cookie.');
  return cookie;
}

let fixtureSession;
export async function studioCookie(){return fixtureSession??=(await login());}

export async function api(path,body,extra={}){
  const cookie=await studioCookie();
  return fetch(origin+path,{
    method:body===undefined||body===null?'GET':'POST',
    headers:{origin,cookie,'content-type':'application/json',...extra},
    body:body===undefined||body===null?undefined:JSON.stringify(body),
  });
}
