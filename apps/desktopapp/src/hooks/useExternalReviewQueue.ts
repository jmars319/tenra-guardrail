import { useEffect, useState } from "react";
import {
  buildExternalActionReviewDecision,
  type ExternalActionReviewDecision,
  type ExternalActionReviewDecisionValue,
  type ExternalActionReviewRequest
} from "@guardrail/api-contracts";
import {
  validateExternalActionReviewDecision,
  validateExternalActionReviewRequest
} from "@guardrail/validation";
import {
  defaultExternalReviewRequest,
  externalReviewQueueStorageKey
} from "../guardrailData";

export interface ExternalReviewQueueItem {
  request: ExternalActionReviewRequest;
  importedAt: string;
  decision?: ExternalActionReviewDecision | undefined;
}

export function useExternalReviewQueue() {
  const [externalReviewText, setExternalReviewText] = useState(
    JSON.stringify(defaultExternalReviewRequest, null, 2)
  );
  const [externalReviewErrors, setExternalReviewErrors] = useState<string[]>([]);
  const [externalReview, setExternalReview] =
    useState<ExternalActionReviewRequest | null>(defaultExternalReviewRequest);
  const [externalReviewQueue, setExternalReviewQueue] = useState<ExternalReviewQueueItem[]>([
    { request: defaultExternalReviewRequest, importedAt: defaultExternalReviewRequest.exportedAt }
  ]);
  const [lastExternalDecisionJson, setLastExternalDecisionJson] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(externalReviewQueueStorageKey);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as ExternalReviewQueueItem[];
      if (Array.isArray(parsed)) {
        setExternalReviewQueue(
          parsed.filter((item) => validateExternalActionReviewRequest(item.request).length === 0)
        );
      }
    } catch {
      window.localStorage.removeItem(externalReviewQueueStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      externalReviewQueueStorageKey,
      JSON.stringify(externalReviewQueue)
    );
  }, [externalReviewQueue]);

  function importExternalReview() {
    try {
      const parsed = JSON.parse(externalReviewText) as ExternalActionReviewRequest;
      const errors = validateExternalActionReviewRequest(parsed);
      setExternalReviewErrors(errors);
      setExternalReview(errors.length === 0 ? parsed : null);
      if (errors.length === 0) {
        setExternalReviewQueue((current) => {
          const withoutExisting = current.filter((item) => item.request.traceId !== parsed.traceId);
          return [{ request: parsed, importedAt: new Date().toISOString() }, ...withoutExisting].slice(0, 12);
        });
      }
    } catch (error) {
      setExternalReview(null);
      setExternalReviewErrors([
        error instanceof Error ? error.message : "External review JSON could not be parsed."
      ]);
    }
  }

  function decideExternalReview(
    request: ExternalActionReviewRequest,
    decision: ExternalActionReviewDecisionValue
  ) {
    const payload = buildExternalActionReviewDecision({ request, decision });
    const errors = validateExternalActionReviewDecision(payload);
    if (errors.length > 0) {
      setExternalReviewErrors(errors);
      return;
    }

    const serialized = JSON.stringify(payload, null, 2);
    setLastExternalDecisionJson(serialized);
    void navigator.clipboard?.writeText(serialized);
    setExternalReviewQueue((current) =>
      current.map((item) =>
        item.request.traceId === request.traceId ? { ...item, decision: payload } : item
      )
    );
  }

  return {
    decideExternalReview,
    externalReview,
    externalReviewErrors,
    externalReviewQueue,
    externalReviewText,
    importExternalReview,
    lastExternalDecisionJson,
    setExternalReviewText
  };
}
