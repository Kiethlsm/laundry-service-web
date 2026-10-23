import fs from 'node:fs';
import {fixture,sql} from '../tests/phase01/local-db.mjs';
import {capture,rollbackSql} from './local-rollback.mjs';
const {db}=fixture({baseline:true}),before=capture(db);
const files=fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
fs.mkdirSync('docs/portfolio/rollback-local',{recursive:true});
for(const file of files){
 sql(db,fs.readFileSync('supabase/migrations/'+file,'utf8'));
 fs.writeFileSync('docs/portfolio/rollback-local/after-'+file,rollbackSql(before,capture(db)));
}
console.log('Prepared '+files.length+' exact-database local rollback SQL artifacts. No hosted connection; no rollback executed.');
