import {sql} from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  pgView,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

type JsonRecord = Record<string, unknown>;
type JsonRecordArray = JsonRecord[];

const timestamps = {
  createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow(),
};

export const languageEnum = pgEnum("language", ["en", "es"]);
export const relationshipTypeEnum = pgEnum("relationship_type", [
  "owner",
  "prospect",
  "network",
  "partner",
  "past_owner",
  "staff",
]);
export const relationshipStrengthEnum = pgEnum("relationship_strength", [
  "cold",
  "warm",
  "hot",
  "close",
]);
export const contactMethodTypeEnum = pgEnum("contact_method_type", [
  "email",
  "phone",
  "whatsapp",
  "telegram",
  "other",
]);
export const entityTypeEnum = pgEnum("entity_type", [
  "individual",
  "llc",
  "trust",
  "corporation",
]);
export const firptaStatusEnum = pgEnum("firpta_status", [
  "not_applicable",
  "withholding_required",
  "exemption_filed",
  "withholding_active",
]);
export const agreementTypeEnum = pgEnum("agreement_type", [
  "full_mgmt",
  "hybrid",
  "revenue_share",
  "lease",
]);
export const taxDocStatusEnum = pgEnum("tax_doc_status", [
  "w9_pending",
  "w9_signed",
  "w8_ben_pending",
  "w8_ben_signed",
  "non_us_resident_signed",
  "none",
]);
export const pricingAggressivenessEnum = pgEnum("pricing_aggressiveness", [
  "conservative",
  "moderate",
  "aggressive",
]);
export const operationalStateEnum = pgEnum("operational_state", [
  "active",
  "onboarding",
  "in_transition",
  "churned",
]);
export const churnRiskFlagEnum = pgEnum("churn_risk_flag", [
  "green",
  "yellow",
  "red",
]);
export const prospectSourceEnum = pgEnum("prospect_source", [
  "lp_capture",
  "network_referral",
  "isaac_direct",
  "event",
  "partner_referral",
  "social",
  "other",
]);
export const budgetSourceEnum = pgEnum("budget_source", [
  "cash",
  "financed",
  "combo",
  "unsure",
]);
export const financingPathEnum = pgEnum("financing_path", [
  "none",
  "itin_mortgage",
  "conventional",
  "foreign_national_loan",
  "unsure",
]);
export const horizonEnum = pgEnum("horizon", [
  "now",
  "within_12mo",
  "beyond_12mo",
  "exploring",
]);
export const intentEnum = pgEnum("intent", [
  "income",
  "lifestyle",
  "both",
  "unsure",
]);
export const servicePathEnum = pgEnum("service_path", [
  "buy",
  "sell",
  "own_operate",
  "undecided",
]);
export const sophisticationEnum = pgEnum("sophistication", [
  "first_time",
  "repeat_buyer",
  "investor",
]);
export const communicationPreferenceEnum = pgEnum("communication_preference", [
  "email",
  "whatsapp",
  "call",
]);
export const qualificationStageEnum = pgEnum("qualification_stage", [
  "new",
  "engaged",
  "call_scheduled",
  "active",
  "site_visit",
  "offer",
  "closed_won",
  "closed_lost",
  "nurture",
]);
export const touchMethodEnum = pgEnum("touch_method", [
  "email",
  "whatsapp",
  "call",
  "in_person",
  "event",
  "other",
]);
export const strategicValueEnum = pgEnum("strategic_value", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "done",
  "cancelled",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "normal",
  "high",
]);
export const communicationDirectionEnum = pgEnum("communication_direction", [
  "inbound",
  "outbound",
]);
export const communicationChannelEnum = pgEnum("communication_channel", [
  "email",
  "whatsapp",
  "sms",
  "call",
  "note",
]);
export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
]);
export const riskClassEnum = pgEnum("risk_class", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const sensitivityClassEnum = pgEnum("sensitivity_class", [
  "public",
  "internal",
  "confidential",
  "restricted",
]);
export const sourceTypeEnum = pgEnum("source_type", [
  "declaration_pdf",
  "hoa_email",
  "developer_site",
  "mls_listing",
  "county_record",
  "municipal_ordinance",
  "profile_miami_article",
  "real_deal_article",
  "condoblackbook_listing",
  "isaac_observation",
  "owner_statement",
  "guesty_export",
  "other",
]);
export const registryTrustTierEnum = pgEnum("registry_trust_tier", [
  "primary",
  "secondary",
  "tertiary",
  "operator",
]);
export const claimVisibilityEnum = pgEnum("claim_visibility", [
  "public",
  "private_note_only",
  "internal_only",
  "restricted",
]);
export const disallowedClaimScopeEnum = pgEnum("disallowed_claim_scope", [
  "public_ui",
  "public_metadata",
  "email_copy",
  "public_docs",
  "public_api_endpoints",
  "sitemap",
  "llms_txt",
  "all_public_surfaces",
]);

export const persons = pgTable(
  "persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameFirst: text("name_first"),
    nameLast: text("name_last"),
    displayName: text("display_name"),
    language: languageEnum("language"),
    country: text("country"),
    city: text("city"),
    timezone: text("timezone"),
    relationshipTypes: relationshipTypeEnum("relationship_types")
      .array()
      .notNull()
      .default(sql`'{}'::relationship_type[]`),
    isaacRelationshipStrength: relationshipStrengthEnum(
      "isaac_relationship_strength",
    ),
    notes: text("notes"),
    sourceInitial: text("source_initial"),
    firstSeenAt: timestamp("first_seen_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("persons_relationship_types_gin").using(
      "gin",
      table.relationshipTypes,
    ),
    index("persons_country_idx").on(table.country),
    index("persons_language_idx").on(table.language),
  ],
);

export const contactMethods = pgTable(
  "contact_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, {onDelete: "cascade"}),
    type: contactMethodTypeEnum("type").notNull(),
    value: text("value").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    verifiedAt: timestamp("verified_at", {withTimezone: true}),
    suppressedAt: timestamp("suppressed_at", {withTimezone: true}),
    suppressionReason: text("suppression_reason"),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("contact_methods_type_value_unique").on(
      table.type,
      table.value,
    ),
    index("contact_methods_person_id_idx").on(table.personId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    personId: uuid("person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    locale: languageEnum("locale"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    landingPath: text("landing_path"),
    utm: jsonb("utm").$type<JsonRecord>().notNull().default(sql`'{}'::jsonb`),
    firstSeenAt: timestamp("first_seen_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("sessions_person_id_idx").on(table.personId),
    index("sessions_locale_idx").on(table.locale),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    personId: uuid("person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data")
      .$type<JsonRecord>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    buildingSlug: text("building_slug"),
    url: text("url"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    locale: languageEnum("locale"),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (table) => [
    index("events_session_created_idx").on(table.sessionId, table.createdAt),
    index("events_person_created_idx").on(table.personId, table.createdAt),
    index("events_event_type_created_idx").on(table.eventType, table.createdAt),
    index("events_building_slug_idx").on(table.buildingSlug),
  ],
);

export const pipelineStates = pgTable(
  "pipeline_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, {onDelete: "cascade"}),
    stage: qualificationStageEnum("stage").notNull(),
    previousStage: qualificationStageEnum("previous_stage"),
    source: text("source").notNull().default("manual"),
    notes: text("notes"),
    actorPersonId: uuid("actor_person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("pipeline_states_person_created_idx").on(
      table.personId,
      table.createdAt,
    ),
    index("pipeline_states_stage_idx").on(table.stage),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id").references(() => persons.id, {
      onDelete: "cascade",
    }),
    ownerPersonId: uuid("owner_person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body"),
    status: taskStatusEnum("status").notNull().default("open"),
    priority: taskPriorityEnum("priority").notNull().default("normal"),
    dueAt: timestamp("due_at", {withTimezone: true}),
    completedAt: timestamp("completed_at", {withTimezone: true}),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("tasks_person_id_idx").on(table.personId),
    index("tasks_due_open_idx").on(table.dueAt, table.status),
  ],
);

export const communications = pgTable(
  "communications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    contactMethodId: uuid("contact_method_id").references(
      () => contactMethods.id,
      {onDelete: "set null"},
    ),
    direction: communicationDirectionEnum("direction").notNull(),
    channel: communicationChannelEnum("channel").notNull(),
    subject: text("subject"),
    bodyText: text("body_text"),
    providerMessageId: text("provider_message_id"),
    idempotencyKey: text("idempotency_key"),
    sentAt: timestamp("sent_at", {withTimezone: true}),
    receivedAt: timestamp("received_at", {withTimezone: true}),
    metadata: jsonb("metadata")
      .$type<JsonRecord>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("communications_person_created_idx").on(
      table.personId,
      table.createdAt,
    ),
    uniqueIndex("communications_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
  ],
);

export const integrationOutbox = pgTable(
  "integration_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    idempotencyKey: text("idempotency_key").notNull(),
    target: text("target").notNull(),
    action: text("action").notNull(),
    payload: jsonb("payload")
      .$type<JsonRecord>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: outboxStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", {withTimezone: true}),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    sentAt: timestamp("sent_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("integration_outbox_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
    index("integration_outbox_status_next_attempt_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
  ],
);

export const ownerRecords = pgTable(
  "owner_records",
  {
    personId: uuid("person_id")
      .primaryKey()
      .references(() => persons.id, {onDelete: "cascade"}),
    entityType: entityTypeEnum("entity_type").notNull().default("individual"),
    taxResidenceCountry: text("tax_residence_country"),
    firptaStatus: firptaStatusEnum("firpta_status"),
    operatingAgreementSignedAt: timestamp("operating_agreement_signed_at", {
      withTimezone: true,
    }),
    operatingAgreementDocUrl: text("operating_agreement_doc_url"),
    agreementType: agreementTypeEnum("agreement_type")
      .notNull()
      .default("full_mgmt"),
    agreementRenewalAt: timestamp("agreement_renewal_at", {withTimezone: true}),
    buildingsOwned: jsonb("buildings_owned")
      .$type<JsonRecordArray>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    expansionEvents: jsonb("expansion_events")
      .$type<JsonRecordArray>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    guestyOwnerId: text("guesty_owner_id").unique(),
    taxDocStatus: taxDocStatusEnum("tax_doc_status"),
    pricingAggressiveness: pricingAggressivenessEnum(
      "pricing_aggressiveness",
    ),
    personalUseBlocks: jsonb("personal_use_blocks")
      .$type<JsonRecordArray>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    preferences: jsonb("preferences")
      .$type<JsonRecord>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    operationalState: operationalStateEnum("operational_state")
      .notNull()
      .default("onboarding"),
    churnedAt: timestamp("churned_at", {withTimezone: true}),
    churnReason: text("churn_reason"),
    namedRepPersonId: uuid("named_rep_person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    acquisitionSourcePersonId: uuid("acquisition_source_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    secondaryContactPersonId: uuid("secondary_contact_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    quarterlyCallLastAt: timestamp("quarterly_call_last_at", {
      withTimezone: true,
    }),
    quarterlyCallNextAt: timestamp("quarterly_call_next_at", {
      withTimezone: true,
    }),
    annualReviewLastAt: timestamp("annual_review_last_at", {withTimezone: true}),
    anniversaryLastAcknowledgedAt: timestamp("anniversary_last_acknowledged_at", {
      withTimezone: true,
    }),
    npsLastScore: integer("nps_last_score"),
    npsLastAt: timestamp("nps_last_at", {withTimezone: true}),
    churnRiskFlag: churnRiskFlagEnum("churn_risk_flag")
      .notNull()
      .default("green"),
    churnRiskNotes: text("churn_risk_notes"),
    revenueLifetimeUsdCents: bigint("revenue_lifetime_usd_cents", {
      mode: "number",
    }).default(0),
    revenueTrailing12moUsdCents: bigint("revenue_trailing_12mo_usd_cents", {
      mode: "number",
    }).default(0),
    revenueYoyChangePct: numeric("revenue_yoy_change_pct", {
      precision: 6,
      scale: 2,
    }),
    lastPLSentAt: timestamp("last_p_l_sent_at", {withTimezone: true}),
    statementOpenLastAt: timestamp("statement_open_last_at", {
      withTimezone: true,
    }),
    portalLoginLastAt: timestamp("portal_login_last_at", {withTimezone: true}),
    referralsMadeCount: integer("referrals_made_count").notNull().default(0),
    referralsMadeValueUsdCents: bigint("referrals_made_value_usd_cents", {
      mode: "number",
    }).default(0),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("owner_records_operational_state_idx").on(table.operationalState),
    index("owner_records_churn_risk_flag_idx").on(table.churnRiskFlag),
    index("owner_records_agreement_renewal_at_idx").on(
      table.agreementRenewalAt,
    ),
    index("owner_records_quarterly_call_next_at_idx").on(
      table.quarterlyCallNextAt,
    ),
    index("owner_records_acquisition_source_idx").on(
      table.acquisitionSourcePersonId,
    ),
  ],
);

export const prospectRecords = pgTable(
  "prospect_records",
  {
    personId: uuid("person_id")
      .primaryKey()
      .references(() => persons.id, {onDelete: "cascade"}),
    source: prospectSourceEnum("source"),
    sourceDetail: text("source_detail"),
    buildingInterestTop: text("building_interest_top"),
    buildingInterestAll: jsonb("building_interest_all")
      .$type<JsonRecordArray>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    budgetMinUsd: bigint("budget_min_usd", {mode: "number"}),
    budgetMaxUsd: bigint("budget_max_usd", {mode: "number"}),
    budgetSource: budgetSourceEnum("budget_source"),
    financingPath: financingPathEnum("financing_path"),
    horizon: horizonEnum("horizon"),
    intent: intentEnum("intent"),
    servicePath: servicePathEnum("service_path"),
    sophistication: sophisticationEnum("sophistication"),
    priorMiamiProperty: boolean("prior_miami_property"),
    priorStrOwner: boolean("prior_str_owner"),
    communicationPreference: communicationPreferenceEnum(
      "communication_preference",
    ),
    behavioralScore: integer("behavioral_score"),
    qualificationStage: qualificationStageEnum("qualification_stage")
      .notNull()
      .default("new"),
    qualificationNotes: text("qualification_notes"),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("prospect_records_qualification_stage_idx").on(
      table.qualificationStage,
    ),
    index("prospect_records_building_interest_top_idx").on(
      table.buildingInterestTop,
    ),
    index("prospect_records_source_idx").on(table.source),
  ],
);

export const networkRecords = pgTable(
  "network_records",
  {
    personId: uuid("person_id")
      .primaryKey()
      .references(() => persons.id, {onDelete: "cascade"}),
    relationshipToIsaac: text("relationship_to_isaac"),
    lastTouchAt: timestamp("last_touch_at", {withTimezone: true}),
    lastTouchMethod: touchMethodEnum("last_touch_method"),
    lastTouchSummary: text("last_touch_summary"),
    trustLevel: integer("trust_level"),
    strategicValue: strategicValueEnum("strategic_value"),
    referralsMade: jsonb("referrals_made")
      .$type<JsonRecordArray>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("network_records_last_touch_at_idx").on(table.lastTouchAt),
    index("network_records_strategic_value_idx").on(table.strategicValue),
  ],
);

export const approvalQueue = pgTable(
  "approval_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposedAt: timestamp("proposed_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    actionType: text("action_type").notNull(),
    riskClass: riskClassEnum("risk_class").notNull(),
    sensitivityClass: sensitivityClassEnum("sensitivity_class")
      .notNull()
      .default("internal"),
    payloadRef: text("payload_ref"),
    payloadSummary: text("payload_summary"),
    targetPersonId: uuid("target_person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    relatedBuildingSlug: text("related_building_slug"),
    evidence: jsonb("evidence").$type<JsonRecord>(),
    diff: text("diff"),
    proposerAgent: text("proposer_agent").notNull(),
    requiresTwoEyes: boolean("requires_two_eyes").notNull().default(false),
    approver1PersonId: uuid("approver_1_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    approver1Role: text("approver_1_role"),
    approved1At: timestamp("approved_1_at", {withTimezone: true}),
    approver2PersonId: uuid("approver_2_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    approver2Role: text("approver_2_role"),
    approved2At: timestamp("approved_2_at", {withTimezone: true}),
    rejectedAt: timestamp("rejected_at", {withTimezone: true}),
    rejectedByPersonId: uuid("rejected_by_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    rejectionReason: text("rejection_reason"),
    executedAt: timestamp("executed_at", {withTimezone: true}),
    executionResult: jsonb("execution_result").$type<JsonRecord>(),
    expiresAt: timestamp("expires_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    index("approval_queue_pending_idx").on(table.proposedAt),
    index("approval_queue_risk_class_idx").on(table.riskClass),
    index("approval_queue_sensitivity_idx").on(table.sensitivityClass),
    index("approval_queue_target_person_idx").on(table.targetPersonId),
  ],
);

export const agentActionLog = pgTable(
  "agent_action_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurredAt: timestamp("occurred_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    agent: text("agent").notNull(),
    action: text("action").notNull(),
    model: text("model"),
    promptVersion: text("prompt_version"),
    sensitivityClass: sensitivityClassEnum("sensitivity_class")
      .notNull()
      .default("internal"),
    inputHash: text("input_hash"),
    outputHash: text("output_hash"),
    outputExcerptRedacted: text("output_excerpt_redacted"),
    outputArtifactUrl: text("output_artifact_url"),
    approvalQueueId: uuid("approval_queue_id").references(
      () => approvalQueue.id,
      {onDelete: "set null"},
    ),
    rollbackPath: text("rollback_path"),
    relatedPersonId: uuid("related_person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    relatedBuildingSlug: text("related_building_slug"),
    durationMs: integer("duration_ms"),
    costUsdCents: integer("cost_usd_cents"),
  },
  (table) => [
    index("agent_action_log_agent_action_idx").on(
      table.agent,
      table.action,
      table.occurredAt,
    ),
    index("agent_action_log_sensitivity_idx").on(table.sensitivityClass),
    index("agent_action_log_related_person_idx").on(table.relatedPersonId),
  ],
);

export const sourceRegistry = pgTable(
  "source_registry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceUrl: text("source_url"),
    sourceFile: text("source_file"),
    sourceType: sourceTypeEnum("source_type").notNull(),
    trustTier: registryTrustTierEnum("trust_tier").notNull(),
    claimBasis: text("claim_basis").notNull(),
    relatedBuildingSlug: text("related_building_slug"),
    pulledAt: timestamp("pulled_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", {withTimezone: true}),
    allowedPublicScopes: text("allowed_public_scopes")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    claimVisibility: claimVisibilityEnum("claim_visibility")
      .notNull()
      .default("internal_only"),
    hash: text("hash"),
    retrievedBy: text("retrieved_by"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("source_registry_building_idx").on(table.relatedBuildingSlug),
    index("source_registry_expiring_idx").on(table.expiresAt),
    index("source_registry_visibility_idx").on(table.claimVisibility),
  ],
);

export const sourceRegistryWithStatus = pgView(
  "source_registry_with_status",
  {
    id: uuid("id"),
    sourceUrl: text("source_url"),
    sourceFile: text("source_file"),
    sourceType: sourceTypeEnum("source_type"),
    trustTier: registryTrustTierEnum("trust_tier"),
    claimBasis: text("claim_basis"),
    relatedBuildingSlug: text("related_building_slug"),
    pulledAt: timestamp("pulled_at", {withTimezone: true}),
    expiresAt: timestamp("expires_at", {withTimezone: true}),
    allowedPublicScopes: text("allowed_public_scopes").array(),
    claimVisibility: claimVisibilityEnum("claim_visibility"),
    hash: text("hash"),
    retrievedBy: text("retrieved_by"),
    notes: text("notes"),
    createdAt: timestamp("created_at", {withTimezone: true}),
    updatedAt: timestamp("updated_at", {withTimezone: true}),
    isExpired: boolean("is_expired"),
    freshnessState: text("freshness_state"),
  },
).as(sql`
  select
    *,
    (expires_at is not null and expires_at < now()) as is_expired,
    case
      when expires_at is null then 'no_expiry'
      when expires_at < now() then 'expired'
      when expires_at < now() + interval '30 days' then 'expiring_soon'
      else 'fresh'
    end as freshness_state
  from ${sourceRegistry}
`);

export const disallowedClaims = pgTable(
  "disallowed_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimPattern: text("claim_pattern").notNull(),
    reason: text("reason").notNull(),
    gateToClear: text("gate_to_clear").notNull(),
    scope: disallowedClaimScopeEnum("scope").notNull(),
    addedAt: timestamp("added_at", {withTimezone: true})
      .notNull()
      .defaultNow(),
    addedByAgent: text("added_by_agent"),
    clearedAt: timestamp("cleared_at", {withTimezone: true}),
    clearedByPersonId: uuid("cleared_by_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    active: boolean("active").generatedAlwaysAs(sql`cleared_at is null`),
    ...timestamps,
  },
  (table) => [
    index("disallowed_claims_active_scope_idx").on(table.scope, table.active),
  ],
);

export const calibrationLogEntries = pgTable(
  "calibration_log_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingSlug: text("building_slug").notNull(),
    relatedPersonId: uuid("related_person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    projectionArtifactId: uuid("projection_artifact_id").references(
      () => communications.id,
      {onDelete: "set null"},
    ),
    projectionMadeAt: timestamp("projection_made_at", {
      withTimezone: true,
    }).notNull(),
    projectionSummary: text("projection_summary").notNull(),
    projectedValueSummary: text("projected_value_summary"),
    measurementWindowStart: timestamp("measurement_window_start", {
      withTimezone: true,
    }).notNull(),
    measurementWindowEnd: timestamp("measurement_window_end", {
      withTimezone: true,
    }).notNull(),
    actualValueSummary: text("actual_value_summary").notNull(),
    accuracyDeltaPct: numeric("accuracy_delta_pct", {precision: 6, scale: 2}),
    retrospectiveNote: text("retrospective_note").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    publishedAt: timestamp("published_at", {withTimezone: true}),
    approvedByPersonId: uuid("approved_by_person_id").references(
      () => persons.id,
      {onDelete: "set null"},
    ),
    sourceIds: uuid("source_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    ...timestamps,
  },
  (table) => [
    index("calibration_log_public_idx").on(table.isPublic, table.publishedAt),
    index("calibration_log_building_idx").on(table.buildingSlug),
  ],
);

export const leadSubmissions = pgTable(
  "lead_submissions",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    payload: jsonb("payload").$type<JsonRecord>().notNull(),
    score: jsonb("score").$type<JsonRecord>().notNull(),
    tier: text("tier").notNull(),
    stage: text("stage").notNull(),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("lead_submissions_idempotency_key_idx").on(
      table.idempotencyKey,
    ),
  ],
);
