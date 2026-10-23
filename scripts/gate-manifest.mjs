export const required=['P01_MIGRATE_EXISTING','P01_RLS_MATRIX','P01_SERVICE_ROLE_GUARD','P01_REVOKE_AND_LAST_ADMIN','P01_SERVER_SESSION_GUARD','P01_CI_REQUIRED','P01_AUTHORIZATION_MATRIX','P01_HOSTED_DEFAULTS'];
const p01Files=['tests/phase01/access.test.mjs','tests/phase01/server.test.mjs','tests/phase01/gate.test.mjs','tests/phase01/matrix.test.mjs','tests/phase01/hosted-defaults.test.mjs'];
export const manifests={
 P01:{required,files:p01Files},
 P02:{required:[...required,'P02_IDEMPOTENT_BOOK','P02_V0_SNAPSHOT','P02_INPUT_RULES','P02_LOOKUP_PRIVACY','P02_SHARED_RATE','P02_BOOKING_UI','P02_HTTP_CONTRACT'],files:[...p01Files,'tests/domain/phase02.test.mjs','tests/domain/http02.test.mjs','tests/browser/booking.test.mjs']}
};
manifests.P03={required:[...manifests.P02.required,'P03_TOLERANCE_BOUNDARY','P03_TOLERANCE_SCOPE','P03_QUOTE_RACE','P03_APPROVAL_EVIDENCE','P03_SETTLEMENT_IMMUTABLE','P03_BAG_INTEGRITY','P03_WORK_TRANSITIONS','P03_ADMIN_DETAIL_UI'],files:[...manifests.P02.files,'tests/domain/phase03.test.mjs','tests/domain/admin-ui.test.mjs']};
manifests.P05={required:[...manifests.P03.required,'P05_ATOMIC_DELIVER_COLLECT','P05_CASH_ROLLBACK','P05_RETRY_RACE','P05_LEDGER_INVARIANTS','P05_REPORT','P05_CANCEL_INCIDENT','P05_END_TO_END','P05_LEDGER_UI'],files:[...manifests.P03.files,'tests/domain/phase05.test.mjs','tests/domain/ledger-ui.test.mjs']};
export function validateGate(output,status,phase='P01') {
 return status===0 && Boolean(manifests[phase]) && manifests[phase].required.every(id=>new RegExp('^ok \\d+ - '+id+'(?:[ \\n]|$)[^\\n]*(?:\\n|$)','m').test(output)) && !/^(?:not )?ok [^\n]* # (?:SKIP|TODO)\b/im.test(output);
}
