import {localSite} from '../tests/browser/local-site.mjs';
const site=await localSite();
console.log(`Local portfolio demo: ${site.base}`);
console.log('Simulated Auth and payments. Local labelled PostgreSQL fixtures only. Never enter real customer data.');
console.log('Fixture account: demo.admin@example.invalid / portfolio-demo-only');
console.log('Ctrl+C closes only this demo process; its unique local fixture DB is retained.');
let stopping=false;
async function close(){if(stopping)return;stopping=true;await site.close();process.exitCode=0;}
process.on('SIGINT',close);process.on('SIGTERM',close);
