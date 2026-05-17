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

function normalizeRows(rows) {
  return rows
    .map((row) => ({
      claimPattern: row.claimPattern ?? row.claim_pattern,
      gateToClear: row.gateToClear ?? row.gate_to_clear,
      reason: row.reason,
      scope: row.scope,
    }))
    .sort((left, right) =>
      `${left.scope}:${left.claimPattern}`.localeCompare(
        `${right.scope}:${right.claimPattern}`,
      ),
    );
}

const databaseUrl = process.env.DATABASE_URL ?? (await readLocalDatabaseUrl());

if (!databaseUrl) {
  console.log("Disallowed-claims DB mirror check skipped: DATABASE_URL is unset.");
  process.exit(0);
}

const expectedRows = normalizeRows(getDisallowedClaimRuleRows());
const sql = neon(databaseUrl);
const activeRows = normalizeRows(
  await sql`
    select claim_pattern, reason, gate_to_clear, scope
    from disallowed_claims
    where active = true
  `,
);

if (JSON.stringify(activeRows) !== JSON.stringify(expectedRows)) {
  console.error("Disallowed-claims DB mirror drift detected.");
  console.error(`Expected active rows: ${expectedRows.length}`);
  console.error(`Actual active rows: ${activeRows.length}`);
  process.exit(1);
}

console.log("Disallowed-claims DB mirror check passed.");
