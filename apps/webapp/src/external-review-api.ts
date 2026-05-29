import type {
  ExternalActionReviewDecision,
  ExternalActionReviewRequest
} from "@guardrail/api-contracts";
import { buildExternalActionReviewDecision } from "@guardrail/api-contracts";
import {
  validateExternalActionReviewDecision,
  validateExternalActionReviewRequest
} from "@guardrail/validation";
import fs from "node:fs";
import path from "node:path";

export interface ExternalReviewQueueItem {
  request: ExternalActionReviewRequest;
  importedAt: string;
  decision?: ExternalActionReviewDecision | undefined;
  callback?: {
    endpoint?: string | undefined;
    status: "not-configured" | "sent" | "failed";
    message?: string | undefined;
    deliveredAt?: string | undefined;
  } | undefined;
}

const queuePath = path.resolve(process.env.GUARDRAIL_EXTERNAL_REVIEW_QUEUE_PATH ?? ".tenra-guardrail-external-reviews.json");

function readPersistedQueue(): ExternalReviewQueueItem[] {
  if (!fs.existsSync(queuePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(queuePath, "utf8")) as { items?: ExternalReviewQueueItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writePersistedQueue() {
  fs.writeFileSync(
    queuePath,
    JSON.stringify(
      {
        schema: "tenra-guardrail.external-review-queue.v1",
        updatedAt: new Date().toISOString(),
        items: queue
      },
      null,
      2
    )
  );
}

const queue: ExternalReviewQueueItem[] = readPersistedQueue();

function upsertRequest(request: ExternalActionReviewRequest): ExternalReviewQueueItem {
  const importedAt = new Date().toISOString();
  const existingIndex = queue.findIndex((item) => item.request.traceId === request.traceId);
  const existing = existingIndex >= 0 ? queue[existingIndex] : undefined;
  const callbackEndpoint = request.callbackUrl?.trim();
  const callback = callbackEndpoint
    ? {
        endpoint: callbackEndpoint,
        status: "not-configured" as const,
        message: "Decision callback has not been sent yet."
      }
    : existing?.callback;
  const item: ExternalReviewQueueItem = {
    request,
    importedAt,
    decision: existing?.decision,
    ...(callback ? { callback } : {})
  };

  if (existingIndex >= 0) {
    queue.splice(existingIndex, 1, item);
  } else {
    queue.unshift(item);
  }
  writePersistedQueue();

  return item;
}

export function exportExternalReviewQueue() {
  return {
    ok: true,
    schema: "tenra-guardrail.external-review-queue.v1",
    exportedAt: new Date().toISOString(),
    items: queue
  };
}

export function exportExternalReviewDecisions() {
  return {
    ok: true,
    schema: "tenra-guardrail.external-review-decisions.v1",
    exportedAt: new Date().toISOString(),
    decisions: queue.flatMap((item) => (item.decision ? [item.decision] : []))
  };
}

export function importExternalReviewPayload(payload: unknown) {
  const candidates =
    payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: Array<{ request?: unknown; decision?: unknown }> }).items.map((item) => item.request)
      : [payload];
  const imported: ExternalReviewQueueItem[] = [];
  const errors: string[] = [];

  for (const candidate of candidates) {
    const request = candidate as ExternalActionReviewRequest;
    const requestErrors = validateExternalActionReviewRequest(request);
    if (requestErrors.length) {
      errors.push(...requestErrors);
      continue;
    }
    imported.push(upsertRequest(request));
  }

  if (errors.length) {
    return { ok: false, errors, items: imported };
  }

  return { ...exportExternalReviewQueue(), importedCount: imported.length };
}

export function attachExternalReviewDecision(traceId: string, payload: unknown) {
  const decision = payload as ExternalActionReviewDecision;
  const errors = validateExternalActionReviewDecision(decision);
  if (errors.length) {
    return { ok: false, errors };
  }

  const item = queue.find((candidate) => candidate.request.traceId === traceId);
  if (!item) {
    return { ok: false, errors: [`No review request found for trace ${traceId}.`] };
  }

  item.decision = decision;
  writePersistedQueue();
  return { ok: true, item };
}

export function createExternalReviewDecision(input: {
  traceId: string;
  decision: ExternalActionReviewDecision["decision"];
  reason?: string | undefined;
  reviewerLabel?: string | undefined;
  callbackUrl?: string | undefined;
}) {
  const item = queue.find((candidate) => candidate.request.traceId === input.traceId);
  if (!item) {
    return { ok: false, errors: [`No review request found for trace ${input.traceId}.`] };
  }

  const decision = buildExternalActionReviewDecision({
    request: item.request,
    decision: input.decision,
    reason: input.reason,
    reviewerLabel: input.reviewerLabel
  });
  item.decision = decision;
  item.callback = input.callbackUrl
    ? {
        endpoint: input.callbackUrl,
        status: "not-configured",
        message: "Decision callback has not been sent yet."
      }
    : undefined;
  writePersistedQueue();
  return { ok: true, item };
}

export async function acknowledgeExternalReviewDecision(traceId: string, callbackUrl?: string | undefined) {
  const item = queue.find((candidate) => candidate.request.traceId === traceId);
  if (!item?.decision) {
    return { ok: false, errors: [`No decision found for trace ${traceId}.`] };
  }

  const endpoint = callbackUrl?.trim() || item.callback?.endpoint?.trim();
  if (!endpoint) {
    item.callback = {
      status: "not-configured",
      message: "No source callback endpoint configured."
    };
    writePersistedQueue();
    return { ok: true, item };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.decision)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    item.callback = {
      endpoint,
      status: "sent",
      deliveredAt: new Date().toISOString(),
      message: `${response.status} ${response.statusText || "OK"}`
    };
  } catch (error) {
    item.callback = {
      endpoint,
      status: "failed",
      deliveredAt: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Decision callback failed."
    };
  }

  writePersistedQueue();
  return { ok: item.callback.status === "sent", item, errors: item.callback.status === "sent" ? [] : [item.callback.message ?? "Decision callback failed."] };
}
