import { spawnSync } from 'node:child_process';
import { validateGate, manifests } from './gate-manifest.mjs';
const phase=process.argv[2]??Object.keys(manifests).at(-1);
if(!manifests[phase]) {console.error('Unknown phase manifest');process.exit(1);}
const r=spawnSync(process.execPath,['--test','--test-reporter=tap','--test-concurrency=1',...manifests[phase].files],{encoding:'utf8',maxBuffer:20*1024*1024});
process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');
if(!validateGate(r.stdout??'',r.status,phase)) {console.error(phase+' gate failed: failing, missing or skipped required test');process.exitCode=1;}
