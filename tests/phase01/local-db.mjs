import { spawnSync, spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// No URLs, env files or credentials. Only a labelled local Docker fixture.
const engines={pg17:['sachsach-hosted-defaults-tests','sachsach-hosted-defaults-test'],supabase15:['sachsach-booking-tests','sachsach-local-regression']};
const engine=engines[process.env.P01_ENGINE??'pg17'];
if(!engine)throw new Error('Unapproved local engine');
const [container,purpose]=engine;
function docker(args, input) {
  const r = spawnSync('docker', args, { input, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || 'Local Docker command failed');
  return r.stdout.trim();
}
export function sql(db, text) {
  return docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-d', db, '-XqAt', '-v', 'ON_ERROR_STOP=1'], text);
}
export function concurrentSql(db, text) {
  return new Promise(resolve => {
    const p = spawn('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', db, '-XqAt', '-v', 'ON_ERROR_STOP=1']);
    let out='', err=''; p.stdout.on('data', c=>out+=c); p.stderr.on('data', c=>err+=c);
    p.on('close', status=>resolve({status,out,err})); p.on('error', e=>resolve({status:1,err:e.message})); p.stdin.end(text);
  });
}
export function fixture({baseline=false}={}) {
  if (docker(['inspect','--format','{{index .Config.Labels "purpose"}}',container]) !== purpose) throw new Error('Unapproved container');
  const db='ss_p01_'+randomUUID().replaceAll('-','');
  sql('postgres',`CREATE DATABASE ${db};`);
  sql(db,`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated,service_role;`);
  sql(db, readFileSync('supabase/schema.sql','utf8'));
  sql(db, readFileSync('supabase/functions.sql','utf8'));
  sql(db,`INSERT INTO auth.users VALUES ${Object.values(ids).map(id=>`('${id}')`).join(',')};
    INSERT INTO profiles(id,role) VALUES ('${ids.admin}','admin'),('${ids.admin2}','admin'),('${ids.staff}','customer'),('${ids.other}','customer'),('${ids.a}','customer'),('${ids.b}','customer');
    INSERT INTO orders(id,customer_id,customer_name,customer_phone,pickup_address,total,note) VALUES
    ('${orders.a}','${ids.a}','ZZ TEST','0000000000','Synthetic address',50000,'Internal evidence'),
    ('${orders.b}','${ids.b}','ZZ TEST','0000000000','Synthetic address',25000,'Internal evidence'),
    ('${orders.guest}',NULL,'ZZ TEST','0000000000','Synthetic address',25000,'Internal evidence');
    INSERT INTO order_items(order_id,service_id,quantity,unit_price) VALUES ('${orders.a}',1,2,25000);`);
  const before=sql(db,"SELECT jsonb_build_object('orders',(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM orders o),'items',(SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM order_items i),'history',(SELECT jsonb_agg(to_jsonb(h) ORDER BY id) FROM order_status_history h));");
  if(!baseline) for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()) sql(db,readFileSync('supabase/migrations/'+file,'utf8'));
  return {db,before};
}
export const ids={admin:'10000000-0000-4000-8000-000000000001',admin2:'10000000-0000-4000-8000-000000000002',staff:'10000000-0000-4000-8000-000000000003',other:'10000000-0000-4000-8000-000000000004',a:'10000000-0000-4000-8000-000000000005',b:'10000000-0000-4000-8000-000000000006'};
export const orders={a:'20000000-0000-4000-8000-000000000001',b:'20000000-0000-4000-8000-000000000002',guest:'20000000-0000-4000-8000-000000000003'};
export function as(user,query,role='authenticated') {return `BEGIN; SET LOCAL ROLE ${role}; SET LOCAL "request.jwt.claim.sub"='${user??''}'; ${query}; ROLLBACK;`;}
export function value(db,user,query,role='authenticated') {return sql(db,as(user,query,role)).split('\n').at(-1);}
