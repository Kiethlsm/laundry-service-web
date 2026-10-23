import test from 'node:test';
import assert from 'node:assert/strict';

test('P01_CI_REQUIRED — a failed, missing or skipped mandatory ID cannot pass',async()=>{
 const {validateGate,required}=await import('../../scripts/gate-manifest.mjs');
 const ok=required.map((id,i)=>`ok ${i+1} - ${id} — proof\n`).join('');
 assert.equal(validateGate(ok,0),true);
 assert.equal(validateGate(ok+'# skipped 0\n# todo 0\n',0),true);
 assert.equal(validateGate(ok,1),false);
 assert.equal(validateGate('',0),false);
 for(const id of required) {
  const line=ok.split('\n').find(l=>l.includes(id));
  assert.equal(validateGate(ok.replace(line,''),0),false);
  assert.equal(validateGate(ok.replace(line,line+' # SKIP'),0),false);
 }
 assert.equal(validateGate(ok.replace('ok 1 -','not ok 1 -'),0),false);
});
