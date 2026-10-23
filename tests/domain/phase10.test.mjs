import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {manifests,validateGate} from '../../scripts/gate-manifest.mjs';
import {fixture,sql,payload,randomUUID} from './helpers.mjs';
import {localSite} from '../browser/local-site.mjs';

test('P10_MANIFEST — prior committed gates, exact optional selection and mandatory release IDs',()=>{
 const release=JSON.parse(fs.readFileSync('docs/portfolio/release.json','utf8'));
 assert.deepEqual(release.phases.map(p=>p.phase),['P01','P02','P03','P05','P09']);
 for(const phase of release.phases){
  const command=spawnSync('git',['show',`${phase.commit}:docs/verification/continuous/${phase.phase}/tests.txt`],{encoding:'utf8'});
  assert.equal(command.status,0);assert.ok(validateGate(command.stdout,0,phase.phase));
  for(const gate of ['lint','typecheck','build'])assert.match(fs.readFileSync(`docs/verification/continuous/${phase.phase}/${gate}.txt`,'utf8'),/Exit: 0/);
 }
 assert.deepEqual(release.required,manifests.P10.required);assert.equal(release.hostedApplied,false);assert.equal(release.pushed,false);
 assert.deepEqual(release.optionalSelected,[]);
 const ci=fs.readFileSync('.github/workflows/portfolio-ci.yml','utf8');
 assert.match(ci,/fetch-depth: 0/,'CI needs prior commit evidence, not a shallow checkout');
 assert.match(ci,/npm run check:phase -- P10/,'CI must run the final cumulative gate including client artifacts');
});

test('P10_DEMO_SMOKE — local HTTP booking/replay/conflict, denied admin and safe fake transport',async()=>{
 assert.ok(fs.existsSync('scripts/demo-local.mjs'),'A documented runnable local demo is required');
 const site=await localSite();
 try{
  const denied=await fetch(site.base+'/admin',{redirect:'manual'});
  if(denied.status===307)assert.ok(denied.headers.get('location').includes('/admin/login'));
  else{
   assert.equal(denied.status,200);const html=await denied.text();
   assert.match(html,/<meta id="__next-page-redirect" http-equiv="refresh" content="1;url=\/admin\/login"\s*\/>/i);
   assert.doesNotMatch(html,/class="demo-financial-report"|name="operation_key"|Synthetic address/);
  }
  const key=randomUUID(),body=payload();const post=data=>fetch(site.base+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
  const first=await post(body);assert.equal(first.status,201);const saved=await first.json();
  const replay=await post(body);assert.equal(replay.status,200);const repeated=await replay.json();assert.equal(repeated.replayed,true);assert.equal(saved.replayed,false);assert.deepEqual({...repeated,replayed:false},saved);
  assert.equal((await post({...body,note:'changed synthetic note'})).status,409);
  assert.equal(sql(site.db,"SELECT count(*) FROM orders WHERE is_synthetic;"),'1');
 }finally{await site.close();}
});

test('P10_SAFE_LABELS — mock-only boundaries, evidence limits and manual walkthrough remain explicit',()=>{
 const guide=fs.readFileSync('docs/portfolio/DEMO.md','utf8');
 for(const label of ['simulated Auth','simulated payments','unflagged','non-commercial','pause','170/170','npm run demo:local','No hosted changes'])assert.ok(guide.includes(label),label);
 const apply=fs.readFileSync('docs/portfolio/HOSTED-APPLY.md','utf8');
 for(const file of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')))assert.ok(apply.includes(file),file);
 for(const rule of ['read state before retry','no trigger bypass','fresh export','owner approval','rollback'])assert.ok(apply.includes(rule),rule);
 assert.ok(fs.readFileSync('lib/supabase-server.ts','utf8').includes('server-only'));
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ss-client-boundary-'));
 const scan=()=>spawnSync(process.execPath,['scripts/check-client-assets.mjs',directory],{encoding:'utf8'});
 fs.writeFileSync(path.join(directory,'fixture.js'),'PORTFOLIO_SERVER_CANARY_NOT_A_SECRET_20261023');
 assert.equal(scan().status,1,'Scanner must reject the injected server marker');
 fs.writeFileSync(path.join(directory,'fixture.js'),'synthetic client fixture');assert.equal(scan().status,0);
});

test('P10_ROLLBACK — local catalog snapshot restores every prefix and refuses post-migration writes',async()=>{
 const {capture,rollbackSql}=await import('../../scripts/local-rollback.mjs');
 const files=fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
 for(const end of files.keys()){
  const {db}=fixture({baseline:true});const before=capture(db);
  for(const file of files.slice(0,end+1))sql(db,fs.readFileSync('supabase/migrations/'+file,'utf8'));
  const script=rollbackSql(before,capture(db));assert.doesNotMatch(script,/^\s*(?:DROP[^;]*\bCASCADE\b|TRUNCATE\b|DELETE FROM\b|ALTER TABLE[^;]*DISABLE TRIGGER)/im);
  sql(db,script);assert.deepEqual(capture(db),before,'Exact original catalog, permissions and row hashes');
 }
 const {db}=fixture({baseline:true});const before=capture(db);
 for(const file of files)sql(db,fs.readFileSync('supabase/migrations/'+file,'utf8'));
 sql(db,"INSERT INTO order_assignments(order_id,staff_id,kind,assigned_by) SELECT o.id,p.id,'processor',p.id FROM orders o CROSS JOIN profiles p WHERE p.role='admin' LIMIT 1;");
 assert.throws(()=>sql(db,rollbackSql(before,capture(db))),/ROLLBACK_HAS_NEW_DATA/);
 assert.equal(sql(db,"SELECT count(*) FROM order_assignments;"),'1');
 const untouched=fixture({baseline:true});const original=capture(untouched.db);
 for(const file of files)sql(untouched.db,fs.readFileSync('supabase/migrations/'+file,'utf8'));
 sql(untouched.db,'UPDATE services SET price=price+1 WHERE id=1;');
 assert.throws(()=>sql(untouched.db,rollbackSql(original,capture(untouched.db))),/ROLLBACK_BASELINE_CHANGED/);
 assert.equal(sql(untouched.db,'SELECT price FROM services WHERE id=1;'),'25001');
});
