import { spawnSync } from 'node:child_process';
import { validateGate } from './gate-manifest.mjs';
if(process.argv[2]!=='P01') {console.error('Unknown/missing phase manifest');process.exit(1);}
const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1','tests/phase01/access.test.mjs','tests/phase01/server.test.mjs','tests/phase01/gate.test.mjs','tests/phase01/matrix.test.mjs','tests/phase01/hosted-defaults.test.mjs'],{encoding:'utf8'});
process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');
if(!validateGate(r.stdout??'',r.status)) {console.error('P01 gate failed: failing, missing or skipped required test');process.exitCode=1;}
