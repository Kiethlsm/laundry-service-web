import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const chunks=files(process.argv[2]??'.next/static').filter(f=>/\.(?:js|map)$/.test(f));
assert.ok(chunks.length>0,'Production client artifacts required');
for(const file of chunks){const body=fs.readFileSync(file,'utf8');
 for(const marker of ['PORTFOLIO_SERVER_CANARY_NOT_A_SECRET_20261023','LOCAL_TEST_SERVICE','portfolio-demo-only','local-fixture-only'])assert.ok(!body.includes(marker),'Server/test marker in client artifact: '+file);
}
console.log(`PASS production client boundary: ${chunks.length} artifacts, four server/test markers absent. Synthetic build environment only; not a scan of hosted secrets.`);
