import {readFile} from "node:fs/promises";

import {neon} from "@neondatabase/serverless";

import {getDisallowedClaimRuleRows} from "../src/server/claims/rules.mjs";

async function readLocalDatabaseUrl() {
  const localEnv = await readFile(".env.local", "utf8").catch(() => "");
  const line = localEnv
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));

  if (!line) {
    return undefined;
  }

  const rawValue = line.slice(line.indexOf("=") + 1).trim();
  return rawValue.replace(/^['"]|['"]$/g, "");
}

function rowKey(row) {
  return `${row.scope}\u0000${row.claimPattern ?? row.claim_pattern}\u0000${row.reason}\u0000${row.gateToClear ?? row.gate_to_clear}`;
}

const databaseUrl = process.env.DATABASE_URL ?? (await readLocalDatabaseUrl());

if (!databaseUrl) {
  console.error("DATABASE_URL is required to sync disallowed_claims.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const expectedRows = getDisallowedClaimRuleRows();
const expectedKeys = new Set(expectedRows.map(rowKey));
const activeRows = await sql`
  select id, claim_pattern, reason, gate_to_clear, scope, added_by_agent
  from disallowed_claims
  where active = true
`;
const activeKeys = new Set(activeRows.map(rowKey));

let cleared = 0;
let inserted = 0;

for (const row of activeRows) {
  if (
    !expectedKeys.has(rowKey(row)) &&
    String(row.added_by_agent ?? "").startsWith("codex-")
  ) {
    await sql`
      update disallowed_claims
      set cleared_at = now(), updated_at = now()
      where id = ${row.id}
    `;
    cleared += 1;
  }
}

for (const row of expectedRows) {
  if (!activeKeys.has(rowKey(row))) {
    await sql`
      insert into disallowed_claims (
        claim_pattern,
        reason,
        gate_to_clear,
        scope,
        added_by_agent
      )
      values (
        ${row.claimPattern},
        ${row.reason},
        ${row.gateToClear},
        ${row.scope},
        'codex-claim-policy-ssot'
      )
    `;
    inserted += 1;
  }
}

console.log(
  `Disallowed-claims DB mirror synced. inserted=${inserted} cleared=${cleared}`,
);
