"use client";
import { useState } from "react";
export function IntakeFields(){
  const [rows,setRows]=useState([0]);
  const [next,setNext]=useState(1);
  return <div className="intake-fields">
    {rows.map((index,position)=><fieldset className="intake-bag" key={index}>
      <legend>Bọc {position+1}</legend><input type="hidden" name="bag_index" value={index}/>
      <div className="field-grid"><label>Mã trên bọc đồ<input name={`bag_tag:${index}`} minLength={3} maxLength={80} required placeholder={`VD: BOC-00${position+1}`}/><span className="field-help">Viết hoặc dán cùng mã này lên bọc để tránh nhầm đồ.</span></label>
      <label>Nhóm dịch vụ<input name={`bag_group:${index}`} required defaultValue="Giặt sấy"/></label><label>Số món trong bọc<input type="number" name={`bag_count:${index}`} min="1" max="1000" step="1" required/></label></div>
      <label>Tình trạng đồ lúc nhận<textarea name={`bag_condition:${index}`} minLength={5} maxLength={1000} required placeholder="VD: 3 áo, 2 quần; một áo có vết ố ở cổ."/></label>
      <details><summary>Món giá trị cao hoặc có vấn đề (tùy chọn)</summary><label>Nhãn riêng<input name={`flag_tag:${index}`} maxLength={80}/></label><label>Mô tả món<input name={`flag_description:${index}`} maxLength={500}/></label><label>Tình trạng riêng<textarea name={`flag_condition:${index}`} maxLength={1000}/></label></details>
      {rows.length>1&&<button type="button" className="text-button intake-remove" onClick={()=>setRows(current=>current.filter(i=>i!==index))}>Bỏ bọc {position+1} khỏi lần nhận này</button>}
    </fieldset>)}
    <button data-add-bag type="button" className="text-button intake-add" disabled={rows.length>=20} onClick={()=>{setRows(current=>[...current,next]);setNext(current=>current+1)}}>+ Thêm bọc đồ</button>
    <p className="field-help">Nhập đủ các bọc của đơn rồi xác nhận một lần. Mỗi bọc có mã riêng, tối đa 20 bọc.</p>
  </div>;
}
