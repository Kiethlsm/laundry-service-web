import http from 'node:http';
import {spawn} from 'node:child_process';
import {fixture,sql,literal,ids} from '../domain/helpers.mjs';
import {until,kill} from './cdp.mjs';
export async function localSite(){
 const commandTrace=[];
 const {db}=fixture();
 const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
 const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:ids.admin,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.fixture-only';
 const user={id:ids.admin,email:'demo.admin@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
 const session={access_token:token,refresh_token:'local-fixture-only',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
 const adapter=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');let input='';for await(const c of req)input+=c;
  try {
   const name=url.pathname.split('/').at(-1);let result;
   const authenticated=req.headers.authorization==='Bearer '+token;
   const service=req.headers.authorization==='Bearer LOCAL_TEST_SERVICE';
   const query=expression=>JSON.parse(sql(db,`BEGIN;SET LOCAL ROLE ${authenticated?'authenticated':'service_role'};SET LOCAL "request.jwt.claim.sub"='${authenticated?ids.admin:''}';SELECT to_jsonb(${expression});COMMIT;`)||'null');
   if(url.pathname==='/auth/v1/token'){
    const credentials=JSON.parse(input);
    if(credentials.email!==user.email||credentials.password!=='portfolio-demo-only'){res.writeHead(400,{'Content-Type':'application/json'});res.end('{"message":"Invalid fixture credentials"}');return;}
    result=session;
   }else if(url.pathname==='/auth/v1/user'){
    if(!authenticated){res.writeHead(401,{'Content-Type':'application/json'});res.end('{"message":"Unauthorized fixture"}');return;}result=user;
   }else if(url.pathname==='/auth/v1/logout')result={};
   else if(req.method==='GET'&&['services','service_categories'].includes(name))result=JSON.parse(sql(db,`SELECT coalesce(jsonb_agg(t),'[]') FROM public.${name} t;`));
   else if(url.pathname.includes('/rpc/')&&name==='book_demo_order') {
    if(!service)throw new Error('Forbidden fixture');
    const p=JSON.parse(input);result=JSON.parse(sql(db,`SET ROLE service_role;SELECT book_demo_order(${literal(JSON.stringify(p.p_payload))}::jsonb,${literal(p.p_key)}::uuid,NULL);`));
   }else if(url.pathname.includes('/rpc/')&&['current_profile_role','demo_order_detail','demo_payment_summary','demo_financial_report','order_command'].includes(name)){
    if(!authenticated)throw new Error('Forbidden fixture');const p=JSON.parse(input||'{}');
    if(name==='order_command')commandTrace.push({action:p.p_action,revision:p.p_revision});
    const args=name==='order_command'?`${literal(p.p_order)}::uuid,${Number(p.p_revision)},${literal(p.p_key)}::uuid,${literal(p.p_action)},${literal(JSON.stringify(p.p_data))}::jsonb`:['demo_order_detail','demo_payment_summary'].includes(name)?`${literal(p.p_order)}::uuid`:'';
    result=query(`public.${name}(${args})`);
   }else if(req.method==='GET'&&name==='orders'&&service){
    const id=url.searchParams.get('id')?.replace(/^eq\./,'');if(id&&!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Invalid fixture ID');
    const rows=JSON.parse(sql(db,`SELECT coalesce(jsonb_agg(to_jsonb(o)||jsonb_build_object('order_items',(SELECT coalesce(jsonb_agg(to_jsonb(i)||jsonb_build_object('services',jsonb_build_object('name',s.name,'unit',s.unit))),'[]') FROM order_items i JOIN services s ON s.id=i.service_id WHERE i.order_id=o.id),'order_status_history',(SELECT coalesce(jsonb_agg(h ORDER BY id),'[]') FROM order_status_history h WHERE h.order_id=o.id))),'[]') FROM orders o ${id?`WHERE id=${literal(id)}::uuid`:''};`));
    result=id?rows[0]??null:rows;
   } else {res.writeHead(404,{'Content-Type':'application/json'});res.end('{}');return;}
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
  }catch(error) {const code=/ERROR:\s+([A-Z_]+)\b/.exec(error.message)?.[1]??'INVALID_ORDER';res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'P0001',message:code}));}
 });
 await new Promise(r=>adapter.listen(0,'127.0.0.1',r));
 const reserve=http.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
 const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${adapter.address().port}`,NEXT_PUBLIC_SUPABASE_ANON_KEY:'LOCAL_TEST_ANON',SUPABASE_SERVICE_ROLE_KEY:'LOCAL_TEST_SERVICE'};
 const next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1','-p',String(port)],{env,stdio:'ignore',windowsHide:true});
 const base=`http://127.0.0.1:${port}`;
 try{await until(async()=>{const r=await fetch(base+'/dat-lich',{signal:AbortSignal.timeout(2000)});return r.status===200;});}
 catch(e){kill(next);adapter.closeAllConnections();await new Promise(r=>adapter.close(r));throw e;}
 return {base,db,commandTrace,close:async()=>{kill(next);adapter.closeAllConnections();await new Promise(r=>adapter.close(r));}};
}
