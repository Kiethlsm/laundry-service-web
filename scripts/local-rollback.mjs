// Catalog-only rollback preparation. SQL execution is restricted by the existing
// labelled local fixture helper; this module accepts no network URL or secrets.
import {sql} from '../tests/phase01/local-db.mjs';
const ident=v=>'"'+v.replaceAll('"','""')+'"';
const text=v=>"'"+v.replaceAll("'","''")+"'";
const role=v=>v==='PUBLIC'?'PUBLIC':ident(v);
const acl=(expr,type,owner)=>`(SELECT coalesce(jsonb_agg(jsonb_build_object('role',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee,a.privilege_type),'[]') FROM aclexplode(coalesce(${expr},acldefault('${type}',${owner}))) a)`;
export function capture(db){
 if(!/^ss_p01_[a-f0-9]{32}$/.test(db))throw new Error('Only disposable local fixture databases');
 const tables=JSON.parse(sql(db,`SELECT coalesce(jsonb_agg(jsonb_build_object(
  'name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
  'acl',${acl('c.relacl','r','c.relowner')},
  'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'acl',${acl('a.attacl','c','c.relowner')}) ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
  'constraints',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',k.conname,'kind',k.contype,'definition',pg_get_constraintdef(k.oid)) ORDER BY k.conname),'[]') FROM pg_constraint k WHERE k.conrelid=c.oid),
  'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',t.tgname,'definition',pg_get_triggerdef(t.oid)) ORDER BY t.tgname),'[]') FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal),
  'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',p.policyname,'command',p.cmd,'permissive',p.permissive,'roles',p.roles,'qual',p.qual,'check',p.with_check) ORDER BY p.policyname),'[]') FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname),
  'indexes',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',i.indexname,'definition',i.indexdef) ORDER BY i.indexname),'[]') FROM pg_indexes i WHERE i.schemaname='public' AND i.tablename=c.relname)
 ) ORDER BY c.relname),'[]') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r';`));
 for(const table of tables){
  const cols=table.columns.map(c=>ident(c.name)).join(',');
  table.hash=sql(db,`SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT ${cols} FROM public.${ident(table.name)}) r;`);
  table.count=Number(sql(db,`SELECT count(*) FROM public.${ident(table.name)};`));
 }
 const functions=JSON.parse(sql(db,`SELECT coalesce(jsonb_agg(jsonb_build_object('signature',format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)),
 'schema',n.nspname,'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',${acl('p.proacl','f','p.proowner')}) ORDER BY n.nspname,p.proname,p.oid),'[]')
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','app_private') AND p.prokind='f'
 AND NOT EXISTS(SELECT FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e');`));
 const defaults=sql(db,"SELECT coalesce(jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(d.defaclrole),'type',d.defaclobjtype,'schema',n.nspname,'acl',d.defaclacl::text) ORDER BY d.defaclobjtype),'[]') FROM pg_default_acl d JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE n.nspname='public';");
 return {database:db,tables,functions,defaults};
}
function resetAcl(object,kind,prior,current){
 const roles=[...new Set(['PUBLIC','anon','authenticated','service_role',...prior.map(a=>a.role),...current.map(a=>a.role)])];
 return [`REVOKE ALL ${kind} ON ${object} FROM ${roles.map(role).join(',')};`,...prior.map(a=>`GRANT ${a.privilege} ${kind} ON ${object} TO ${role(a.role)}${a.grantable?' WITH GRANT OPTION':''};`)];
}
function tableAcl(table,current){
 const object='TABLE public.'+ident(table.name);
 const rows=resetAcl(object,'',table.acl,current.acl);
 for(const col of table.columns){
  const actual=current.columns.find(c=>c.name===col.name);if(!actual)throw new Error('Missing baseline column');
  const roles=[...new Set(['PUBLIC','anon','authenticated','service_role',...col.acl.map(a=>a.role),...actual.acl.map(a=>a.role)])];
  rows.push(`REVOKE ALL (${ident(col.name)}) ON ${object} FROM ${roles.map(role).join(',')};`);
  for(const a of col.acl)rows.push(`GRANT ${a.privilege} (${ident(col.name)}) ON ${object} TO ${role(a.role)}${a.grantable?' WITH GRANT OPTION':''};`);
 }
 return rows;
}
export function rollbackSql(before,after){
 if(before.defaults!==after.defaults)throw new Error('Unexpected default privilege change');
 if(before.functions.some(f=>f.schema==='app_private'))throw new Error('Pre-existing private schema requires separate review');
 const existing=new Map(before.tables.map(t=>[t.name,t]));
 if(after.tables.some(t=>t.owner!=='postgres')||before.tables.some(t=>t.owner!=='postgres'))throw new Error('Owner differs; review snapshot');
 if(before.database!==after.database||!/^ss_p01_[a-f0-9]{32}$/.test(before.database))throw new Error('Different or non-local snapshot');
 const out=['-- GENERATED FROM LOCAL CATALOGS ONLY. NOT HOSTED-READY.','BEGIN;',`DO $$ BEGIN IF current_database()<>${text(before.database)} THEN RAISE EXCEPTION 'ROLLBACK_WRONG_DATABASE'; END IF; END $$;`,'SET LOCAL lock_timeout=\'5s\';','SET LOCAL statement_timeout=\'30s\';',`LOCK TABLE ${after.tables.map(t=>'public.'+ident(t.name)).join(',')} IN ACCESS EXCLUSIVE MODE;`];
 // Reject data rather than deleting it. Compare original columns, never PII values.
 for(const table of after.tables){
  const old=existing.get(table.name);
  if(!old){out.push(`DO $$ BEGIN IF EXISTS(SELECT FROM public.${ident(table.name)}) THEN RAISE EXCEPTION 'ROLLBACK_HAS_NEW_DATA'; END IF; END $$;`);continue;}
  const cols=old.columns.map(c=>ident(c.name)).join(',');
  out.push(`DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT ${cols} FROM public.${ident(table.name)}) r)<>${text(old.hash)} THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;`);
 }
 if(after.tables.find(t=>t.name==='profiles').columns.some(c=>c.name==='is_active'))out.push("DO $$ BEGIN IF EXISTS(SELECT FROM public.profiles WHERE NOT is_active OR revision<>0) THEN RAISE EXCEPTION 'ROLLBACK_PROFILE_CHANGED'; END IF; END $$;");
 // Remove only changed/new trigger and policy definitions; no trigger bypass for DML.
 for(const t of after.tables){const b=existing.get(t.name);
  for(const trigger of t.triggers)if(!b?.triggers.some(x=>JSON.stringify(x)===JSON.stringify(trigger)))out.push(`DROP TRIGGER ${ident(trigger.name)} ON public.${ident(t.name)};`);
  for(const policy of t.policies)if(!b?.policies.some(x=>JSON.stringify(x)===JSON.stringify(policy)))out.push(`DROP POLICY ${ident(policy.name)} ON public.${ident(t.name)};`);
 }
 for(const f of before.functions)out.push(f.definition+';');
 for(const f of after.functions)if(!before.functions.some(b=>b.signature===f.signature))out.push(`DROP FUNCTION ${f.signature};`);
 // Break new-table FK cycles explicitly, without dependency-wide deletion.
 for(const t of after.tables)if(!existing.has(t.name))for(const c of t.constraints.filter(c=>c.kind==='f'))out.push(`ALTER TABLE public.${ident(t.name)} DROP CONSTRAINT ${ident(c.name)};`);
 for(const t of after.tables){const b=existing.get(t.name);if(!b)continue;
  for(const c of t.constraints)if(!b.constraints.some(x=>JSON.stringify(x)===JSON.stringify(c)))out.push(`ALTER TABLE public.${ident(t.name)} DROP CONSTRAINT ${ident(c.name)};`);
 }
 for(const t of after.tables)if(!existing.has(t.name))out.push(`DROP TABLE public.${ident(t.name)};`);
 for(const b of before.tables){const t=after.tables.find(t=>t.name===b.name);if(!t)throw new Error('Missing baseline table');
  const constraintIndexes=new Set(t.constraints.filter(c=>['p','u','x'].includes(c.kind)).map(c=>c.name));
  for(const index of t.indexes)if(!b.indexes.some(x=>x.name===index.name)&&!constraintIndexes.has(index.name))out.push(`DROP INDEX public.${ident(index.name)};`);
  for(const col of t.columns)if(!b.columns.some(c=>c.name===col.name))out.push(`ALTER TABLE public.${ident(b.name)} DROP COLUMN ${ident(col.name)};`);
  for(const c of b.constraints)if(!t.constraints.some(x=>JSON.stringify(x)===JSON.stringify(c)))out.push(`ALTER TABLE public.${ident(b.name)} ADD CONSTRAINT ${ident(c.name)} ${c.definition};`);
  for(const trigger of b.triggers)if(!t.triggers.some(x=>JSON.stringify(x)===JSON.stringify(trigger)))out.push(trigger.definition+';');
  for(const p of b.policies)if(!t.policies.some(x=>JSON.stringify(x)===JSON.stringify(p)))out.push(`CREATE POLICY ${ident(p.name)} ON public.${ident(b.name)} AS ${p.permissive} FOR ${p.command} TO ${p.roles.map(r=>role(r==='public'?'PUBLIC':r)).join(',')}${p.qual?' USING ('+p.qual+')':''}${p.check?' WITH CHECK ('+p.check+')':''};`);
  out.push(`ALTER TABLE public.${ident(b.name)} ${b.rls?'ENABLE':'DISABLE'} ROW LEVEL SECURITY;`,`ALTER TABLE public.${ident(b.name)} ${b.force?'FORCE':'NO FORCE'} ROW LEVEL SECURITY;`,...tableAcl(b,t));
 }
 for(const f of before.functions)out.push(...resetAcl('FUNCTION '+f.signature,'',f.acl,after.functions.find(a=>a.signature===f.signature)?.acl??[]));
 if(after.functions.some(f=>f.schema==='app_private'))out.push('DROP SCHEMA app_private;');
 out.push('COMMIT;');return out.join('\n')+'\n';
}
