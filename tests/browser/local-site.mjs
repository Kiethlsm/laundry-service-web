import http from 'node:http';
import {spawn} from 'node:child_process';
import {fixture,sql,literal} from '../domain/helpers.mjs';
import {until,kill} from './cdp.mjs';
export async function localSite(){
 const {db}=fixture();
 const adapter=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');let input='';for await(const c of req)input+=c;
  try {
   const name=url.pathname.split('/').at(-1);let result;
   if(req.method==='GET'&&['services','service_categories'].includes(name))result=JSON.parse(sql(db,`SELECT coalesce(jsonb_agg(t),'[]') FROM public.${name} t;`));
   else if(url.pathname.includes('/rpc/')&&name==='book_demo_order') {
    const p=JSON.parse(input);result=JSON.parse(sql(db,`SET ROLE service_role;SELECT book_demo_order(${literal(JSON.stringify(p.p_payload))}::jsonb,${literal(p.p_key)}::uuid,NULL);`));
   } else {res.writeHead(404,{'Content-Type':'application/json'});res.end('{}');return;}
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
  }catch {res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'P0001',message:'INVALID_ORDER'}));}
 });
 await new Promise(r=>adapter.listen(0,'127.0.0.1',r));
 const reserve=http.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
 const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${adapter.address().port}`,NEXT_PUBLIC_SUPABASE_ANON_KEY:'LOCAL_TEST_ANON',SUPABASE_SERVICE_ROLE_KEY:'LOCAL_TEST_SERVICE'};
 const next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1','-p',String(port)],{env,stdio:'ignore',windowsHide:true});
 const base=`http://127.0.0.1:${port}`;
 try{await until(async()=>{const r=await fetch(base+'/dat-lich',{signal:AbortSignal.timeout(2000)});return r.status===200;});}
 catch(e){kill(next);adapter.closeAllConnections();await new Promise(r=>adapter.close(r));throw e;}
 return {base,db,close:async()=>{kill(next);adapter.closeAllConnections();await new Promise(r=>adapter.close(r));}};
}
