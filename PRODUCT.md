# Sạch Sạch

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Auth, Vercel. Fixed by PIPELINE.md.

## Users

Vietnamese-speaking laundry customers booking pickup without an account; an authenticated shop administrator managing orders. Recruiters reviewing a CV demo.

## Product Purpose

A small, complete laundry-service demo: select services, book pickup, receive an order code, track with code and phone, and manage progress as admin.

## Operating Context

Mobile-first public site. Admin uses a searchable order list and sequential status changes. Six service categories and seed prices are defined in PIPELINE.md.

## Capabilities and Constraints

Follow PIPELINE.md. No online payments, realtime, multilingual support, automated tests, Docker, state library, or heavy ORM. Server owns prices. Service-role secrets stay server-only. External Supabase setup, admin provisioning and Vercel deployment require account access that is not currently provided.

## Brand Commitments

User confirmed the fictional name Sạch Sạch and delegated design choices. Vietnamese copy. Contact details are illustrative and explicitly labeled demo.

## Evidence on Hand

PIPELINE.md is the specification and source for all prices, services and status rules. No real shop, testimonials, operational guarantees or photographs supplied.

## Product Principles

Keep booking direct, make estimated costs explicit, protect customer order lookup, make every demo limitation visible, keep implementation small.
