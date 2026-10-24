# Sạch Sạch

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Auth, Vercel. Fixed by PIPELINE.md.

## Users

Vietnamese-speaking laundry customers, and the owner and their mother running one shop without employees. Customers can book as guests; Google sign-in and an account area are the first local slice toward real usage. Two separate admin accounts share shop-management capabilities.

## Product Purpose

A small family-shop service: book laundry, agree the measured price, follow progress, and pay cash or manually reconciled bank transfer. The deployed baseline remains a portfolio demo; real-operation features are released only after their own tests and approval. Current scope is docs/SMALL_SHOP_SCOPE.md; the v1.2 portfolio plan is historical evidence.

## Operating Context

Mobile-first public site. Admin's target is four groups of orders: new, in progress, ready to return, completed. No staffing, shifts, payroll or assignments UI. Preserve the existing server transitions and immutable money/quote contracts behind simple screens. Six service categories and seed prices originated in PIPELINE.md.

## Capabilities and Constraints

Reuse Next.js, Supabase and the existing packages. Native Node tests, local Docker PostgreSQL 17.11, the authorization matrix and hosted-defaults checks are required gates. Server owns prices and order identity. Service-role secrets stay server-only. Keep production unchanged during local slices; hosted/Auth configuration, migrations, deploys and paid services require scoped approval. Google is the selected customer sign-in; phone is a contact field, SMS OTP is deferred. Existing payment/evidence flows remain demo/mock until explicitly converted and verified.

## Brand Commitments

User confirmed the name Sạch Sạch and delegated design choices. Vietnamese copy. Public contact: 0903992813; 104/4G Nhất Chi Mai, phường Tân Bình, Thành phố Hồ Chí Minh. Opening hours are not yet supplied.

## Evidence on Hand

The owner confirmed a real shop operated by two family members and supplied a Techcombank QR. The owner supplied the public phone/address on 2026-10-24. Do not invent opening hours, testimonials, coordinates or operational guarantees. Google sign-in was confirmed working on Preview before the accepted production rollout. Historical deployment evidence is in docs/verification/rollout. The local Google slice and its real-provider setup requirements are documented separately.

## Product Principles

Keep booking direct, make estimated costs explicit, protect customer order lookup, make every demo limitation visible, keep implementation small.
