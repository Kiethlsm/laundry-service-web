import { spawnSync } from 'node:child_process';
const required=['P01_MIGRATE_EXISTING','P01_RLS_MATRIX','P01_SERVICE_ROLE_GUARD','P01_REVOKE_AND_LAST_ADMIN','P01_SERVER_SESSION_GUARD'];
if(process.argv[2]!=='P01') {console.error('Unknown/missing phase manifest');process.exit(1);}
const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1','tests/phase01/access.test.mjs','tests/phase01/server.test.mjs'],{encoding:'utf8'});
process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');
const complete=required.every(id=>new RegExp('^ok \\d+ - '+id+'[^\\n]*(?:\\n|$)','m').test(r.stdout??''))&&!/# (?:SKIP|TODO)/i.test(r.stdout??'');
if(r.status!==0||!complete) {console.error('P01 gate failed: failing, missing or skipped required test');process.exitCode=1;}
