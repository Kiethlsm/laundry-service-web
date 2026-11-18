# Local demo branch deployment dependency

Historical P10 dependency snapshot below. For the subsequently authorized hosted migration and passing Preview verification, see [rollout evidence](verification/rollout/README.md). This historical statement is not the current hosted state.

The current hosted database/production are deliberately unchanged (old code/functions, last verified 27 rows). This branch is incompatible with that schema: login/requireAdmin require current_profile_role, and later demo operations require their versioned migrations. Do not deploy this branch against the old hosted schema. Keep existing production code in place until a separately approved coordinated database + Preview rollout passes.

No code or SQL from parked fix/booking-tests-and-validation is a prerequisite. Apply only the migrations on this branch, in filename order, after fresh read-only export/count/function/ACL verification and owner approval. Never rerun baseline schema.sql or functions.sql as a hosted upgrade. Local tests bootstrap those files solely into new allowlisted fixture databases.

Before a future hosted apply: export schema/data outside Git, verify counts, capture original functions/ACLs/default privileges and triggers, check for collisions/legacy review flags, test the exact rollback against a disposable copy, and stage code/schema compatibility. Stop on any unexpected data/schema/ACL result. After a write/apply transport error, read state before any retry, do not repeat blindly. Apply each migration once transactionally, then query ACLs and probe with anon. Only an approved, fully passing Preview may precede a production switch. Never restore over customer data or disable triggers to force cleanup.

This run performs no hosted apply, push, merge or deployment. A browser pointed at hosted cannot test the new feature slice.
