import type {PublicFact} from "@/content/atlas";

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

export const localDisallowedClaimRules: readonly DisallowedClaimRule[] = [
  {
    id: "guaranteed_income",
    pattern: /\b(guaranteed|risk[- ]?free|assured)\b.{0,60}\b(income|return|roi|yield)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Performance claims require reviewed source support and legal approval.",
  },
  {
    id: "brokerage_authority",
    pattern: /\b(licensed|authorized|official)\b.{0,60}\b(brokerage|broker|real estate agent)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Brokerage-authority claims are gated until Stage 0 clears.",
  },
  {
    id: "str_approval_absolute",
    pattern: /\b(str|short[- ]term rental|airbnb)\b.{0,60}\b(approved|legal|allowed|permitted)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Rental-use claims need source-specific verification.",
  },
  {
    id: "legal_tax_advice",
    pattern: /\b(legal|tax|firpta|visa)\b.{0,60}\b(advice|guarantee|safe|solved)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Legal and tax conclusions need professional review.",
  },
  {
    id: "real_estate_agent_schema",
    pattern: /\bRealEstateAgent\b/,
    scopes: ["public_metadata", "all_public_surfaces"],
    reason: "RealEstateAgent schema is gated until brokerage authority clears.",
  },
  {
    id: "public_secret_env",
    pattern: /\bNEXT_PUBLIC_[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|DATABASE|POSTGRES|RESEND|GUESTY|AUTH)\b/,
    scopes: ["all_public_surfaces"],
    reason: "Secret-bearing environment names must not become public copy.",
  },
  {
    id: "raw_guesty_export",
    pattern: /\b(raw\s+Guesty|Guesty\s+export|reservation\s+export|payout\s+export)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Raw operating exports are never public surfaces.",
  },
];

function appliesToScope(rule: DisallowedClaimRule, scope: ClaimScope): boolean {
  return rule.scopes.includes("all_public_surfaces") || rule.scopes.includes(scope);
}

export function findClaimPolicyViolations(
  text: string,
  scope: ClaimScope,
): readonly ClaimPolicyViolation[] {
  return localDisallowedClaimRules
    .filter((rule) => appliesToScope(rule, scope) && rule.pattern.test(text))
    .map((rule) => ({
      ruleId: rule.id,
      reason: rule.reason,
    }));
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
