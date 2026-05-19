import {getPublicClaims, getSourcePacket} from "../src/lib/source-packets";
import {findClaimPolicyViolations} from "../src/server/claims/policy";

const requiredPackets = ["beachwalk-resort"] as const;

const errors: string[] = [];

for (const slug of requiredPackets) {
  const packet = getSourcePacket(slug);

  if (!packet) {
    errors.push(`${slug}: source packet missing`);
    continue;
  }

  if (packet.buildingId !== slug) {
    errors.push(`${slug}: packet buildingId mismatch`);
  }

  if (packet.claims.length < 8 || packet.claims.length > 12) {
    errors.push(`${slug}: expected 8-12 claims, got ${packet.claims.length}`);
  }

  for (const claim of packet.claims) {
    if (claim.buildingId !== slug) {
      errors.push(`${slug}/${claim.claimId}: claim buildingId mismatch`);
    }

    const violations = findClaimPolicyViolations(claim.publicText, "public_ui");

    for (const violation of violations) {
      errors.push(`${slug}/${claim.claimId}: ${violation.ruleId}`);
    }
  }

  const renderedClaimIds = new Set(
    getPublicClaims(slug).map((claim) => claim.claimId),
  );

  if (renderedClaimIds.has("stale-render-test")) {
    errors.push(`${slug}: stale-render-test should not be public-renderable`);
  }
}

if (errors.length > 0) {
  throw new Error(`Source packet verification failed:\n${errors.join("\n")}`);
}

console.log("Source packet verification passed.");
