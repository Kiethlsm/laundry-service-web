export const required=['P01_MIGRATE_EXISTING','P01_RLS_MATRIX','P01_SERVICE_ROLE_GUARD','P01_REVOKE_AND_LAST_ADMIN','P01_SERVER_SESSION_GUARD','P01_CI_REQUIRED'];
export function validateGate(output,status) {
 return status===0 && required.every(id=>new RegExp('^ok \\d+ - '+id+'[^\\n]*(?:\\n|$)','m').test(output)) && !/^(?:not )?ok [^\n]* # (?:SKIP|TODO)\b/im.test(output);
}
