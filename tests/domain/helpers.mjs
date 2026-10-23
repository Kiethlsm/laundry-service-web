import {randomUUID} from 'node:crypto';
import {fixture,sql,ids,orders,as,value,concurrentSql} from '../phase01/local-db.mjs';
export {fixture,sql,ids,orders,as,value,concurrentSql,randomUUID};
export const literal=v=>v===null?'NULL':"'"+String(v).replaceAll("'","''")+"'";
export const payload=(extra={})=>({name:'ZZ TEST',phone:'0000000000',address:'Synthetic address',pickup:new Date(Date.now()+86400000).toISOString(),payment:'cash',note:'Synthetic fixture',consent:true,tolerance_consent:true,items:[{service_id:1,quantity:2.5},{service_id:3,quantity:1}],...extra});
export function book(db,body=payload(),key=randomUUID(),owner=null) {
 return JSON.parse(sql(db,`SET ROLE service_role;SELECT book_demo_order(${literal(JSON.stringify(body))}::jsonb,'${key}',${owner?literal(owner)+'::uuid':'NULL'});`));
}
