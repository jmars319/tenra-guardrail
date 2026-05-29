import type {
  ApprovalRequestSummary,
  GuardrailProfileSummary,
  ProjectSummary,
  ProviderConnectionSummary,
  SessionSummary
} from "@guardrail/domain";
import type {
  EvaluateServiceActionResponse,
  GuardrailServiceBoundary,
  RuntimeBoundarySnapshot,
  ProviderConnection,
  RuntimeOverview,
  ToolExecutionResponse
} from "@guardrail/runtime-contracts";

export interface RuntimeQueryMap {
  "runtime.getOverview": RuntimeOverview;
  "runtime.getBoundarySnapshot": RuntimeBoundarySnapshot;
  "runtime.runToolRequest": ToolExecutionResponse;
  "service.evaluateAction": EvaluateServiceActionResponse;
  "service.getBoundary": GuardrailServiceBoundary;
  "providers.list": ProviderConnection[];
  "projects.list": ProjectSummary[];
  "profiles.list": GuardrailProfileSummary[];
  "sessions.list": SessionSummary[];
  "approvals.list": ApprovalRequestSummary[];
}

export interface DesktopSnapshotPayload {
  overview: RuntimeOverview;
  providers: ProviderConnectionSummary[];
  projects: ProjectSummary[];
  profiles: GuardrailProfileSummary[];
  sessions: SessionSummary[];
  approvals: ApprovalRequestSummary[];
}

export interface RuntimeEvent {
  type: "approval-requested" | "session-updated";
  summary: string;
}

export type GuardrailReviewSourceApp =
  | "align"
  | "assembly"
  | "derive"
  | "facet"
  | "ledger"
  | "partition"
  | "proxy"
  | "registry"
  | "scout"
  | "sentinel"
  | "vicina"
  | "manual";

export type GuardrailExternalActionKind =
  | "publish"
  | "send-message"
  | "write-file"
  | "run-command"
  | "post-charge"
  | "execute-system-change"
  | "moderation-action"
  | "other";

export interface ExternalActionReviewRequest {
  schema: "tenra-guardrail.external-action-review.v1";
  exportedAt: string;
  sourceApp: GuardrailReviewSourceApp;
  actionKind: GuardrailExternalActionKind;
  actorLabel: string;
  targetLabel: string;
  summary: string;
  evidence: Array<{
    label: string;
    value: string;
  }>;
  recommendedDecision?: "allow" | "review" | "deny";
  traceId: string;
  callbackUrl?: string | undefined;
}

export type ExternalActionReviewDecisionValue = "allow" | "review" | "deny";

export interface ExternalActionReviewDecision {
  schema: "tenra-guardrail.external-action-decision.v1";
  decidedAt: string;
  sourceApp: "guardrail";
  requestTraceId: string;
  returnToApp: GuardrailReviewSourceApp;
  actionKind: GuardrailExternalActionKind;
  targetLabel: string;
  decision: ExternalActionReviewDecisionValue;
  reviewerLabel: string;
  reason: string;
  evidenceCount: number;
  sourceReturn: {
    app: GuardrailReviewSourceApp;
    traceId: string;
    expectedSchema: string;
    action: "apply-guardrail-decision";
  };
}

const returnSchemaByApp: Partial<Record<GuardrailReviewSourceApp, string>> = {
  align: "tenra-align.review-reply-route.v1",
  assembly: "tenra-assembly.proxy-notice-handoff.v1",
  derive: "tenra-derive.reasoning-brief.v1",
  partition: "tenra-partition.lab-validation-result.v1",
  scout: "tenra-scout.opportunity-handoff.v1",
  sentinel: "tenra-sentinel.risk-brief.v1",
  vicina: "tenra-vicina.workflow-handoff.v1"
};

export function buildExternalActionReviewDecision(input: {
  request: ExternalActionReviewRequest;
  decision: ExternalActionReviewDecisionValue;
  reviewerLabel?: string | undefined;
  reason?: string | undefined;
  decidedAt?: string | undefined;
}): ExternalActionReviewDecision {
  return {
    schema: "tenra-guardrail.external-action-decision.v1",
    decidedAt: input.decidedAt ?? new Date().toISOString(),
    sourceApp: "guardrail",
    requestTraceId: input.request.traceId,
    returnToApp: input.request.sourceApp,
    actionKind: input.request.actionKind,
    targetLabel: input.request.targetLabel,
    decision: input.decision,
    reviewerLabel: input.reviewerLabel ?? "local-operator",
    reason:
      input.reason ??
      (input.decision === "allow"
        ? "Reviewed evidence and approved the requested action."
        : input.decision === "deny"
          ? "Reviewed evidence and denied the requested action."
        : "More human review is required before this action can proceed."),
    evidenceCount: input.request.evidence.length,
    sourceReturn: {
      app: input.request.sourceApp,
      traceId: input.request.traceId,
      expectedSchema: returnSchemaByApp[input.request.sourceApp] ?? input.request.schema,
      action: "apply-guardrail-decision"
    }
  };
}
