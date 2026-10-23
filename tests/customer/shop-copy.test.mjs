import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('SHOP_COPY — public pages omit project branding while transfer remains explicitly manual',()=>{
 const layout=fs.readFileSync('app/layout.tsx','utf8'),booking=fs.readFileSync('components/booking-form.tsx','utf8'),transfer=fs.readFileSync('components/bank-transfer.tsx','utf8');
 for(const source of [layout,booking,transfer])assert.doesNotMatch(source,/>[^<>]*(?:portfolio|Dự án demo|bản demo|v0|portfolio-v1\.2|cho CV)[^<>]*</i);
 assert.match(booking,/name="consent" required/);assert.match(booking,/name="tolerance_consent"/);
 assert.match(transfer,/Nguyễn Thị Mai/);assert.match(transfer,/38606688/);assert.match(transfer,/Đối soát thủ công/);assert.match(transfer,/không tự xác nhận đã thanh toán/);
 assert.doesNotMatch(layout,/123 Đường Mẫu|0900 000 000/);
});
