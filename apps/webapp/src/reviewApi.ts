import type {
  ExternalActionReviewDecision,
  ExternalActionReviewRequest
} from "@guardrail/api-contracts";
import type { QueueResponse, ReviewQueueItem } from "./reviewTypes";

export function downloadJsonFile(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function fetchReviewQueue() {
  const response = await fetch("/api/external-reviews");
  return parseQueueResponse(response, "External review queue failed.");
}

export async function postDecision(input: {
  callbackUrl?: string | undefined;
  decision: ExternalActionReviewDecision["decision"];
  request: ExternalActionReviewRequest;
}) {
  const response = await fetch("/api/external-review-decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestTraceId: input.request.traceId,
      decision: input.decision,
      callbackUrl: input.callbackUrl,
      reason: reasonForDecision(input.decision)
    })
  });
  return parseQueueResponse(response, "Decision creation failed.");
}

export async function postDecisionCallback(item: ReviewQueueItem, callbackUrl?: string | undefined) {
  const response = await fetch("/api/external-review-callbacks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestTraceId: item.request.traceId,
      callbackUrl
    })
  });
  return parseQueueResponse(response, "Decision callback failed.");
}

async function parseQueueResponse(response: Response, fallbackMessage: string) {
  const body = (await response.json()) as QueueResponse;
  if (!response.ok || !body.ok) {
    throw new Error(body.errors?.join(", ") || fallbackMessage);
  }
  return body;
}

function reasonForDecision(decision: ExternalActionReviewDecision["decision"]) {
  if (decision === "allow") {
    return "Reviewed evidence and approved the requested action.";
  }
  if (decision === "deny") {
    return "Reviewed evidence and denied the requested action.";
  }
  return "More human review is required before this action can proceed.";
}
