// @ts-check

/**
 * Committed public-claim policy authority.
 *
 * Runtime rendering, build scanning, and the database mirror all consume this
 * file. The `disallowed_claims` table is an operational mirror/audit surface,
 * not an independently editable policy source.
 */

export const claimScopes = Object.freeze([
  "public_ui",
  "public_metadata",
  "email_copy",
  "public_docs",
  "public_api_endpoints",
  "sitemap",
  "llms_txt",
  "all_public_surfaces",
]);

/**
 * @typedef {(typeof claimScopes)[number]} ClaimScope
 */

/**
 * @typedef {Readonly<{
 *   id: string;
 *   pattern: RegExp;
 *   scopes: readonly ClaimScope[];
 *   reason: string;
 *   gateToClear: string;
 * }>} DisallowedClaimRule
 */

/**
 * @typedef {Readonly<{
 *   ruleId: string;
 *   reason: string;
 * }>} ClaimPolicyViolation
 */

/**
 * @typedef {Readonly<{
 *   id: string;
 *   claimPattern: string;
 *   reason: string;
 *   gateToClear: string;
 *   scope: ClaimScope;
 * }>} DisallowedClaimRuleRow
 */

/** @type {readonly DisallowedClaimRule[]} */
export const disallowedClaimRules = Object.freeze([
  {
    id: "brokerage_authority",
    pattern: /(brokerage|buyer\s+representation|listing\s+representation|real\s+estate\s+agency)/i,
    scopes: ["all_public_surfaces"],
    reason: "Brokerage-services language is gated until Stage 0 confirms brokerage authority.",
    gateToClear: "stage_0_brokerage_license",
  },
  {
    id: "financial_performance",
    pattern: /(\$\s?\d[\d,]*(?:\.\d{2})?|\b\d+(?:\.\d+)?%\b).{0,80}(roi|return|yield|net\s+to\s+owner|cash\s+flow|profit)/i,
    scopes: ["all_public_surfaces"],
    reason: "Specific dollar ROI and return claims require Guesty data and Isaac sign-off.",
    gateToClear: "guesty_data_signed_off",
  },
  {
    id: "legal_tax_advice",
    pattern: /(FIRPTA|tax|legal|attorney|lawyer).{0,120}(advice|advise|structure|withholding|exemption)/i,
    scopes: ["all_public_surfaces"],
    reason: "FIRPTA, legal, or tax-advice generation requires a disclaimer and human review.",
    gateToClear: "legal_tax_disclaimer_review",
  },
  {
    id: "owner_financials",
    pattern: /(owner\s+P&L|owner\s+statement|per-unit|unit-level).{0,120}(\$|revenue|net|gross|ADR|RevPAR)/i,
    scopes: ["all_public_surfaces"],
    reason: "Owner P&L and per-unit dollar figures are not public until approved.",
    gateToClear: "owner_p_l_public_approval",
  },
  {
    id: "raw_guesty_export",
    pattern: /(raw\s+Guesty|Guesty\s+export|reservation\s+export|payout\s+export)/i,
    scopes: ["all_public_surfaces"],
    reason: "Raw Guesty exports are restricted and never public-source material.",
    gateToClear: "never_public",
  },
  {
    id: "real_estate_agent_schema",
    pattern: /\bRealEstateAgent\b/,
    scopes: ["public_metadata"],
    reason: "RealEstateAgent JSON-LD is gated until Stage 0 confirms brokerage authority.",
    gateToClear: "stage_0_brokerage_license",
  },
  {
    id: "public_secret_env",
    pattern: /\bNEXT_PUBLIC_.*(SECRET|TOKEN|KEY|PASSWORD|DATABASE|POSTGRES|RESEND|GUESTY|AUTH)\b/,
    scopes: ["all_public_surfaces"],
    reason: "Production secrets must never use NEXT_PUBLIC_* env names.",
    gateToClear: "never_public",
  },
  {
    id: "rental_use_absolute",
    pattern: /\b(str|short[- ]?term[- ]?rental|airbnb|rental[- ]?use)\b.{0,80}\b(approved|legal|allowed|permitted)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Rental-use claims need source-specific verification before publication.",
    gateToClear: "building_source_packet_approved",
  },
  {
    id: "v7_yield_return_promise",
    pattern: /\d+\s*%\s*(yield|return|appreciation|IRR|ROI)/i,
    scopes: ["all_public_surfaces"],
    reason: "Yield, return, appreciation, IRR, and ROI percentages are not public claims.",
    gateToClear: "guesty_data_signed_off",
  },
  {
    id: "v7_guaranteed_rental_outcome",
    pattern: /(guaranteed|guarantee[ds]?)\s+(rental|income|return|yield|STR|occupancy)/i,
    scopes: ["all_public_surfaces"],
    reason: "Guaranteed rental, income, yield, STR, or occupancy claims are prohibited.",
    gateToClear: "never_public",
  },
  {
    id: "v7_room305_brokerage_claim",
    pattern: /\bRoom\s*305\s+(is|are)\s+(a|the)?\s*(broker|brokerage|licensed)/i,
    scopes: ["all_public_surfaces"],
    reason: "Room 305 LLC must not be presented as a broker, brokerage, or licensed entity.",
    gateToClear: "stage_0_brokerage_license",
  },
  {
    id: "v7_public_rate_claim",
    pattern: /\$\s?\d+(\.\d+)?\s*(per\s+night|per\s+month|monthly|nightly|\/night|\/month)/i,
    scopes: ["all_public_surfaces"],
    reason: "Specific nightly or monthly rates require approved private source packets.",
    gateToClear: "guesty_data_signed_off",
  },
  {
    id: "v7_property_management_company_claim",
    pattern: /\b(property|condo|building)\s+management\s+(services|company|firm)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Property-management company or services language is gated.",
    gateToClear: "management_authority_review",
  },
  {
    id: "v7_best_miami_superlative",
    pattern: /\bbest\s+(condo|investment|broker|firm)\s+in\s+Miami\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Best-in-Miami superlatives are unsubstantiated public claims.",
    gateToClear: "never_public",
  },
  {
    id: "v7_turnkey_investment_claim",
    pattern: /\bturnkey\s+(rental|STR|income|investment)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Turnkey rental or investment claims overstate the current public proof.",
    gateToClear: "building_source_packet_approved",
  },
  {
    id: "v7_exclusive_investment_claim",
    pattern: /\bexclusive\s+(investment|opportunity|listing)\b/i,
    scopes: ["all_public_surfaces"],
    reason: "Exclusive investment or listing language is out of scope for the public LP.",
    gateToClear: "stage_0_brokerage_license",
  },
]);

/**
 * @param {DisallowedClaimRule} rule
 * @param {ClaimScope} scope
 */
export function appliesToClaimScope(rule, scope) {
  return (
    scope === "all_public_surfaces" ||
    rule.scopes.includes("all_public_surfaces") ||
    rule.scopes.includes(scope)
  );
}

/**
 * @param {string} text
 * @param {ClaimScope} scope
 * @returns {readonly ClaimPolicyViolation[]}
 */
export function findDisallowedClaimViolations(text, scope) {
  return disallowedClaimRules
    .filter((rule) => appliesToClaimScope(rule, scope) && rule.pattern.test(text))
    .map((rule) => ({
      ruleId: rule.id,
      reason: rule.reason,
    }));
}

/**
 * @returns {readonly DisallowedClaimRuleRow[]}
 */
export function getDisallowedClaimRuleRows() {
  return disallowedClaimRules.flatMap((rule) =>
    rule.scopes.map((scope) => ({
      id: rule.id,
      claimPattern: rule.pattern.source,
      reason: rule.reason,
      gateToClear: rule.gateToClear,
      scope,
    })),
  );
}
