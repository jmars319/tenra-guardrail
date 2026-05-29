import type { GuardrailPolicy } from "@guardrail/policy";
import type { ProviderDefinition } from "@guardrail/provider-config";
import type {
  ExternalActionReviewDecision,
  ExternalActionReviewRequest
} from "@guardrail/api-contracts";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateProviderDefinition(
  provider: ProviderDefinition
): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(provider.label)) {
    errors.push("provider label must be a non-empty string");
  }

  if (!isNonEmptyString(provider.notes)) {
    errors.push("provider notes must be a non-empty string");
  }

  return errors;
}

export function validateGuardrailPolicy(
  policy: GuardrailPolicy
): string[] {
  const errors: string[] = [];

  if (policy.projectRoots.length === 0) {
    errors.push("policy must declare at least one project root");
  }

  if (policy.allowedReadRoots.length === 0) {
    errors.push("policy must declare at least one allowed read root");
  }

  if (policy.allowedWriteRoots.length === 0) {
    errors.push("policy must declare at least one allowed write root");
  }

  if (policy.networkEnabled) {
    errors.push("network-capable tooling must stay disabled by default");
  }

  return errors;
}

export function validateExternalActionReviewRequest(
  request: ExternalActionReviewRequest
): string[] {
  const errors: string[] = [];
  const candidate =
    request && typeof request === "object"
      ? (request as Partial<ExternalActionReviewRequest>)
      : undefined;

  if (!candidate) {
    return ["external action review request must be an object"];
  }

  if (candidate.schema !== "tenra-guardrail.external-action-review.v1") {
    errors.push("external action review request must use schema tenra-guardrail.external-action-review.v1");
  }

  for (const [label, value] of [
    ["exportedAt", candidate.exportedAt],
    ["actorLabel", candidate.actorLabel],
    ["targetLabel", candidate.targetLabel],
    ["summary", candidate.summary],
    ["traceId", candidate.traceId]
  ] as const) {
    if (!isNonEmptyString(value)) {
      errors.push(`${label} must be a non-empty string`);
    }
  }

  const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];

  if (!Array.isArray(candidate.evidence) || evidence.length === 0) {
    errors.push("external action review request must include at least one evidence item");
  }

  for (const item of evidence) {
    if (!isNonEmptyString(item.label) || !isNonEmptyString(item.value)) {
      errors.push("external action review evidence items must include labels and values");
    }
  }

  if (candidate.callbackUrl !== undefined && !isNonEmptyString(candidate.callbackUrl)) {
    errors.push("callbackUrl must be a non-empty string when provided");
  }

  return errors;
}

export function validateExternalActionReviewDecision(
  decision: ExternalActionReviewDecision
): string[] {
  const errors: string[] = [];
  const candidate =
    decision && typeof decision === "object"
      ? (decision as Partial<ExternalActionReviewDecision>)
      : undefined;

  if (!candidate) {
    return ["external action review decision must be an object"];
  }

  if (candidate.schema !== "tenra-guardrail.external-action-decision.v1") {
    errors.push("external action review decision must use schema tenra-guardrail.external-action-decision.v1");
  }

  if (!["allow", "review", "deny"].includes(candidate.decision ?? "")) {
    errors.push("external action review decision must be allow, review, or deny");
  }

  for (const [label, value] of [
    ["decidedAt", candidate.decidedAt],
    ["requestTraceId", candidate.requestTraceId],
    ["targetLabel", candidate.targetLabel],
    ["reviewerLabel", candidate.reviewerLabel],
    ["reason", candidate.reason]
  ] as const) {
    if (!isNonEmptyString(value)) {
      errors.push(`${label} must be a non-empty string`);
    }
  }

  if (typeof candidate.evidenceCount !== "number" || candidate.evidenceCount < 0) {
    errors.push("evidenceCount must be a non-negative number");
  }

  if (!candidate.sourceReturn || typeof candidate.sourceReturn !== "object") {
    errors.push("sourceReturn must describe where the decision should be applied");
  } else {
    for (const [label, value] of [
      ["sourceReturn.app", candidate.sourceReturn.app],
      ["sourceReturn.traceId", candidate.sourceReturn.traceId],
      ["sourceReturn.expectedSchema", candidate.sourceReturn.expectedSchema],
      ["sourceReturn.action", candidate.sourceReturn.action]
    ] as const) {
      if (!isNonEmptyString(value)) {
        errors.push(`${label} must be a non-empty string`);
      }
    }
    if (candidate.sourceReturn.action !== "apply-guardrail-decision") {
      errors.push("sourceReturn.action must be apply-guardrail-decision");
    }
  }

  return errors;
}
