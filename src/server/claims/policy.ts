import type {PublicFact} from "@/content/atlas";
import {
  disallowedClaimRules,
  findDisallowedClaimViolations,
} from "./rules.mjs";

type ClaimScope =
  | "public_ui"
  | "public_metadata"
  | "email_copy"
  | "public_docs"
  | "public_api_endpoints"
  | "sitemap"
  | "llms_txt"
  | "all_public_surfaces";

type DisallowedClaimRule = Readonly<{
  id: string;
  pattern: RegExp;
  scopes: readonly ClaimScope[];
  reason: string;
}>;

export type ClaimPolicyViolation = Readonly<{
  ruleId: string;
  reason: string;
}>;

export const localDisallowedClaimRules: readonly DisallowedClaimRule[] =
  disallowedClaimRules as readonly DisallowedClaimRule[];

export function findClaimPolicyViolations(
  text: string,
  scope: ClaimScope,
): readonly ClaimPolicyViolation[] {
  return findDisallowedClaimViolations(
    text,
    scope,
  ) as readonly ClaimPolicyViolation[];
}

export function filterRenderablePublicFacts(
  facts: readonly PublicFact[],
  scope: ClaimScope,
): readonly PublicFact[] {
  return facts.filter((fact) => {
    if (fact.claimVisibility !== "public" || fact.scope !== scope) {
      return false;
    }

    if (fact.expiresAt && new Date(fact.expiresAt).getTime() < Date.now()) {
      return false;
    }

    return findClaimPolicyViolations(fact.text, scope).length === 0;
  });
}
