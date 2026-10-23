import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,sql} from './local-db.mjs';

test('P01_HOSTED_DEFAULTS — postgres owner, permissive direct defaults, explicit ACLs and fixed definer paths',()=>{
 const {db}=fixture();
 assert.equal(sql(db,`SELECT count(*) FROM pg_default_acl WHERE defaclrole='postgres'::regrole AND defaclobjtype IN ('f','r') AND defaclnamespace='public'::regnamespace AND defaclacl::text LIKE '%anon=%' AND defaclacl::text LIKE '%authenticated=%';`),'2');
 const acl=()=>sql(db,`SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('app_private','public') AND p.prosecdef AND (p.proowner<>'postgres'::regrole OR NOT EXISTS(SELECT FROM unnest(p.proconfig) s WHERE s LIKE 'search_path=%') OR has_function_privilege('anon',p.oid,'EXECUTE') OR EXISTS(SELECT FROM aclexplode(p.proacl) a WHERE a.grantee=0));`);
 assert.equal(acl(),'0');
 assert.equal(sql(db,`SELECT has_table_privilege('anon','idempotency_keys','SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated','idempotency_keys','SELECT,INSERT,UPDATE,DELETE');`),'f');
 // Sensitivity control: the same default privileges really are leaky, and our
 // detector must notice one omitted explicit REVOKE, not merely match SQL text.
 sql(db,`CREATE FUNCTION public.zz_leak_control() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path=public AS 'SELECT 1';`);
 assert.equal(acl(),'1');
 sql(db,`REVOKE ALL ON FUNCTION public.zz_leak_control() FROM PUBLIC,anon,authenticated,service_role;`);
 assert.equal(acl(),'0');
});
