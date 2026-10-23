import {formatVND} from '@/lib/format';
export type DemoReport={cash_flow:{day:string;amount:number}[];delivered_value:{day:string;amount:number}[];unverified_approvals:number};
export function DemoFinancialReport({report}:{report:DemoReport}){
 return <section className="demo-notice demo-report"><h2>Thu chi và giá trị đơn</h2><p>Tất cả số tiền đều mô phỏng. Ghi chú đồng ý chưa xác minh: <strong>{report.unverified_approvals}</strong>.</p><div className="demo-columns"><div><h3>Thu / hoàn theo ngày phát sinh</h3>{report.cash_flow.length?<ul className="demo-inventory">{report.cash_flow.map(r=><li key={r.day}>{r.day} · {formatVND(r.amount)}</li>)}</ul>:<p>Chưa có tiền mô phỏng.</p>}</div><div><h3>Giá trị đơn theo ngày bàn giao</h3>{report.delivered_value.length?<ul className="demo-inventory">{report.delivered_value.map(r=><li key={r.day}>{r.day} · {formatVND(r.amount)}</li>)}</ul>:<p>Chưa có bàn giao.</p>}</div></div></section>;
}
