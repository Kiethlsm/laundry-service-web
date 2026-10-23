import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const phase=process.argv[2];
if(!/^P(?:01|02|03|05|09|10)$/.test(phase??''))throw new Error('Phase required');
const dir=`docs/verification/continuous/${phase}`;mkdirSync(dir,{recursive:true});
// Empty overrides prevent Next from filling hosted values from .env.local.
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''};
const gates=[['lint',['node_modules/eslint/bin/eslint.js']],['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],['tests',['scripts/test-gate.mjs',phase]],['build',['node_modules/next/dist/bin/next','build']]];
for(const [name,args]of gates) {
 const r=spawnSync(process.execPath,args,{encoding:'utf8',env,maxBuffer:20*1024*1024});
 const log=`Command: node ${args.join(' ')}\nExit: ${r.status}\n${r.stdout??''}${r.stderr??''}`;
 writeFileSync(`${dir}/${name}.txt`,log);console.log(JSON.stringify({phase,gate:name,exit:r.status}));
 if(r.status!==0){process.stdout.write(log);process.exit(r.status??1);}
}
