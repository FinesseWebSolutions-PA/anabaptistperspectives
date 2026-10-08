import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';

const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
const allowed=env=>String(env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const recoveryCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('').match(/.{1,8}/g).join('-');
const normalizeCode=v=>String(v||'').toLowerCase().replace(/[\s-]/g,'');
const validPassword=p=>typeof p==='string'&&p.length>=12&&p.length<=128;

export function createAuth(req,env){
 const origin=new URL(req.url).origin;
 return betterAuth({appName:'Perspectives Studio',baseURL:origin,basePath:'/api/auth',secret:env.BETTER_AUTH_SECRET,
  database:drizzleAdapter(drizzle(env.DB),{provider:'sqlite',schema}),
  user:{modelName:'authUser',changeEmail:{enabled:false},deleteUser:{enabled:false}},
  account:{modelName:'authAccount',accountLinking:{enabled:false}},
  session:{modelName:'authSession',expiresIn:60*60*24*14,disableSessionRefresh:true,cookieCache:{enabled:false}},
  verification:{modelName:'authVerification',storeIdentifier:'hashed'},
  emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12,maxPasswordLength:128,revokeSessionsOnPasswordReset:true},
  trustedOrigins:[origin],rateLimit:{enabled:false}, // Atomic D1 limiter below covers every exposed auth mutation, including account-based limits.
  advanced:{cookiePrefix:'perspectives',useSecureCookies:new URL(req.url).protocol==='https:',defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'}},
  logger:{disabled:true},telemetry:{enabled:false}
 });
}
export async function adminIdentity(req,env){
 if(!env.BETTER_AUTH_SECRET||!req.headers.get('cookie'))return null;
 const session=await createAuth(req,env).api.getSession({headers:req.headers});
 if(!session?.user||!allowed(env).includes(session.user.email.toLowerCase()))return null;
 // Only accounts provisioned by the private setup flow have a recovery record.
 const provisioned=await env.DB.prepare('SELECT user_id FROM studio_recovery WHERE user_id=?').bind(session.user.id).first();
 return provisioned?session.user:null;
}
async function limit(env,key,max,window=900){
 const now=Math.floor(Date.now()/1000),bucket=Math.floor(now/window);
 const result=await env.DB.prepare('INSERT INTO studio_auth_limits (key,bucket,count) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN bucket=excluded.bucket THEN count+1 ELSE 1 END,bucket=excluded.bucket RETURNING count').bind(key,bucket).first();
 return result.count<=max;
}
async function setupValid(env,token){
 if(typeof token!=='string'||token.length<32||token.length>160||!env.ADMIN_SETUP_TOKEN_HASH||Date.now()>Date.parse(env.ADMIN_SETUP_EXPIRES||''))return false;
 if(!Number.isFinite(Date.parse(env.ADMIN_SETUP_EXPIRES||'')))return false;
 if(await digest(token)!==env.ADMIN_SETUP_TOKEN_HASH)return false;
 return !(await env.DB.prepare('SELECT token_hash FROM studio_setup_used WHERE token_hash=?').bind(env.ADMIN_SETUP_TOKEN_HASH).first());
}
export async function authRoute(req,env){
 const path=new URL(req.url).pathname;
 if(!path.startsWith('/api/auth/'))return null;
 if(!env.BETTER_AUTH_SECRET)return reply({error:'Sign-in is being configured. Please try again shortly.'},503);
 const ip=req.headers.get('cf-connecting-ip')||'shared';
 if(path==='/api/auth/setup-info'&&req.method==='GET'){
  if(!await limit(env,'setup-info:'+await digest(ip),60))return reply({error:'Please wait a few minutes and try again.'},429);
  if(!await setupValid(env,req.headers.get('authorization')?.replace(/^Bearer /,'')))return reply({error:'This setup link has expired or has already been used.'},403);
  return reply({email:allowed(env)[0]});
 }
 const routes=['/api/auth/sign-in/email','/api/auth/sign-out','/api/auth/setup','/api/auth/recover'];
 if(!routes.includes(path))return reply({error:'Not found.'},404);
 if(req.method!=='POST')return reply({error:'Use POST.'},405);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Please use this website to sign in.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required.'},415);
 // Bound input before parsing or password work, including chunked requests.
 if(Number(req.headers.get('content-length'))>4096)return reply({error:'Request is too large.'},413);
 const reader=req.body?.getReader();let raw='',size=0;const decoder=new TextDecoder();
 if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return reply({error:'Request is too large.'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Invalid request.'},400);
 if(!await limit(env,'ip:'+await digest(ip),45))return reply({error:'Too many attempts. Please try again in 15 minutes.'},429);
 const email=String(body.email||'').trim().toLowerCase();
 if(path==='/api/auth/sign-out')return createAuth(req,env).handler(new Request(req.url,{method:'POST',headers:req.headers,body:'{}'}));
 if(path==='/api/auth/sign-in/email'){
  // Unknown emails share a bucket, preventing unbounded attacker-created rows.
  const account=allowed(env).includes(email)?email:'unknown';
  if(!await limit(env,'login:'+account,10))return reply({error:'Too many attempts. Please try again in 15 minutes.'},429);
  if(!validPassword(body.password)||!allowed(env).includes(email))return reply({error:'The email or password is incorrect.'},401);
  const response=await createAuth(req,env).handler(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({email,password:body.password,rememberMe:body.rememberMe!==false})}));
  if(!response.ok)return reply({error:'The email or password is incorrect.'},401);
  const headers=new Headers(response.headers);headers.set('cache-control','no-store');headers.set('referrer-policy','no-referrer');
  return new Response(JSON.stringify({ok:true}),{headers});
 }
 if(path==='/api/auth/setup'){
  if(!await limit(env,'setup',8))return reply({error:'Please try again in 15 minutes.'},429);
  if(!await setupValid(env,body.token))return reply({error:'This setup link has expired or has already been used.'},403);
  if(!validPassword(body.password))return reply({error:'Use a password between 12 and 128 characters.'},400);
  const email=allowed(env)[0];if(!email)return reply({error:'Administrator access is not configured.'},503);
  if(await env.DB.prepare('SELECT id FROM auth_user WHERE email=?').bind(email).first())return reply({error:'This account is already set up. Please sign in.'},409);
  const id=crypto.randomUUID(),code=recoveryCode(),password=await hashPassword(body.password),now=Date.now();
  try{
   // D1 batch is a transaction: a replay or failed insert cannot leave a partial account.
   await env.DB.batch([
    env.DB.prepare('INSERT INTO studio_setup_used (token_hash,used_at) VALUES (?,?)').bind(env.ADMIN_SETUP_TOKEN_HASH,now),
    env.DB.prepare('INSERT INTO auth_user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,0,?,?)').bind(id,'Editor',email,now,now),
    env.DB.prepare('INSERT INTO auth_account (id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,'credential',id,password,now,now),
    env.DB.prepare('INSERT INTO studio_recovery (user_id,code_hash,updated_at) VALUES (?,?,?)').bind(id,await digest(normalizeCode(code)),now)
   ]);
  }catch{return reply({error:'Setup could not complete. Try the link again or sign in if you already set your password.'},409);}
  return reply({recoveryCode:code});
 }
 if(path==='/api/auth/recover'){
  if(!await limit(env,'recover:'+(allowed(env).includes(email)?email:'unknown'),5))return reply({error:'Too many attempts. Please try again in 15 minutes.'},429);
  if(!validPassword(body.newPassword))return reply({error:'Use a password between 12 and 128 characters.'},400);
  const codeHash=await digest(normalizeCode(body.recoveryCode));
  const record=allowed(env).includes(email)&&await env.DB.prepare('SELECT u.id FROM auth_user u JOIN studio_recovery r ON r.user_id=u.id WHERE u.email=? AND r.code_hash=?').bind(email,codeHash).first();
  if(!record)return reply({error:'Check your email and recovery code, then try again.'},401);
  const code=recoveryCode(),password=await hashPassword(body.newPassword),now=Date.now();
  // Each statement checks the old code; rotation last makes concurrent replay a no-op.
  const result=await env.DB.batch([
   env.DB.prepare('UPDATE auth_account SET password=?,updated_at=? WHERE user_id=? AND provider_id=? AND EXISTS (SELECT 1 FROM studio_recovery WHERE user_id=? AND code_hash=?)').bind(password,now,record.id,'credential',record.id,codeHash),
   env.DB.prepare('DELETE FROM auth_session WHERE user_id=? AND EXISTS (SELECT 1 FROM studio_recovery WHERE user_id=? AND code_hash=?)').bind(record.id,record.id,codeHash),
   env.DB.prepare('UPDATE studio_recovery SET code_hash=?,updated_at=? WHERE user_id=? AND code_hash=?').bind(await digest(normalizeCode(code)),now,record.id,codeHash)
  ]);
  if(!result[2].meta.changes)return reply({error:'This recovery code has already been used.'},401);
  return reply({recoveryCode:code});
 }
}
