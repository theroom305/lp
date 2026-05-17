import type {InferInsertModel} from "drizzle-orm";

import {
  agentActionLog,
  approvalQueue,
  type sensitivityClassEnum,
  type riskClassEnum,
} from "../../../db/schema";
import {getDb} from "@/server/db/client";

type RiskClass = (typeof riskClassEnum.enumValues)[number];
type SensitivityClass = (typeof sensitivityClassEnum.enumValues)[number];

type ApprovalQueueInput = Readonly<{
  actionType: string;
  riskClass: RiskClass;
  sensitivityClass?: SensitivityClass;
  payloadRef: string;
  payloadSummary: string;
  relatedBuildingSlug?: string;
  proposerAgent: string;
  requiresTwoEyes?: boolean;
  evidence?: Record<string, unknown>;
}>;

type AgentActionInput = Readonly<{
  agent: string;
  action: string;
  sensitivityClass: SensitivityClass;
  approvalQueueId?: string;
  relatedBuildingSlug?: string;
  inputHash?: string;
  outputHash?: string;
  outputExcerptRedacted?: string;
  rollbackPath?: string;
  durationMs?: number;
}>;

type ApprovalQueueInsert = InferInsertModel<typeof approvalQueue>;
type AgentActionInsert = InferInsertModel<typeof agentActionLog>;

export async function enqueueApproval(
  input: ApprovalQueueInput,
): Promise<string> {
  const db = getDb();
  const values: ApprovalQueueInsert = {
    actionType: input.actionType,
    riskClass: input.riskClass,
    sensitivityClass: input.sensitivityClass ?? "internal",
    payloadRef: input.payloadRef,
    payloadSummary: input.payloadSummary,
    relatedBuildingSlug: input.relatedBuildingSlug,
    evidence: input.evidence,
    proposerAgent: input.proposerAgent,
    requiresTwoEyes: input.requiresTwoEyes ?? false,
  };
  const [row] = await db
    .insert(approvalQueue)
    .values(values)
    .returning({id: approvalQueue.id});

  return row.id;
}

export async function logAgentAction(input: AgentActionInput): Promise<string> {
  const db = getDb();
  const values: AgentActionInsert = {
    agent: input.agent,
    action: input.action,
    sensitivityClass: input.sensitivityClass,
    approvalQueueId: input.approvalQueueId,
    relatedBuildingSlug: input.relatedBuildingSlug,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    outputExcerptRedacted: input.outputExcerptRedacted,
    rollbackPath: input.rollbackPath,
    durationMs: input.durationMs,
  };
  const [row] = await db
    .insert(agentActionLog)
    .values(values)
    .returning({id: agentActionLog.id});

  return row.id;
}
