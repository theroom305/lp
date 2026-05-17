import {neon} from "@neondatabase/serverless";

import type {Locale} from "@/i18n/routing";
import type {PublicFact, SourceTrustTier} from "@/content/atlas";
import {env} from "@/server/env";

type SourceRegistryRow = Readonly<{
  id: string;
  related_building_slug: string;
  claim_basis: string;
  trust_tier: "primary" | "secondary" | "tertiary" | "operator";
  expires_at: string | null;
}>;

const trustTierMap: Record<SourceRegistryRow["trust_tier"], SourceTrustTier> = {
  primary: "primary_record",
  secondary: "secondary_market",
  tertiary: "unverified",
  operator: "operator_observed",
};

export async function getPublicFactsForBuilding(
  buildingSlug: string,
  locale: Locale,
): Promise<readonly PublicFact[]> {
  if (!env.DATABASE_URL) {
    return [];
  }

  const sql = neon(env.DATABASE_URL);
  const rows = (await sql`
    select
      id,
      related_building_slug,
      claim_basis,
      trust_tier,
      expires_at
    from source_registry_with_status
    where related_building_slug = ${buildingSlug}
      and claim_visibility = 'public'
      and is_expired = false
      and allowed_public_scopes @> array['public_ui']::text[]
    order by pulled_at desc
  `) as unknown as readonly SourceRegistryRow[];

  return rows.map((row) => ({
    id: row.id,
    buildingSlug: row.related_building_slug,
    text: row.claim_basis,
    sourceId: row.id,
    scope: "public_ui",
    claimVisibility: "public",
    trustTier: trustTierMap[row.trust_tier],
    expiresAt: row.expires_at,
    confidence:
      row.trust_tier === "primary"
        ? "verified"
        : row.trust_tier === "operator"
          ? "operator_observed"
          : "secondary",
    locale,
  }));
}
