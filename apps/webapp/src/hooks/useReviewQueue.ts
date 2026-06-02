import { useEffect, useMemo, useState } from "react";
import type {
  ExternalActionReviewDecision,
  ExternalActionReviewRequest
} from "@guardrail/api-contracts";
import { fetchReviewQueue, postDecision, postDecisionCallback } from "../reviewApi";
import type { ReviewQueueItem } from "../reviewTypes";

export function useReviewQueue() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [notice, setNotice] = useState("Loading external review queue.");
  const [pendingTraceId, setPendingTraceId] = useState("");
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [callbackUrlByTrace, setCallbackUrlByTrace] = useState<Record<string, string>>({});
  const [selectedTraceId, setSelectedTraceId] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSource = sourceFilter === "all" || item.request.sourceApp === sourceFilter;
      const searchable = [
        item.request.sourceApp,
        item.request.actionKind,
        item.request.targetLabel,
        item.request.summary,
        item.decision?.decision ?? "",
        item.callback?.status ?? "",
        ...item.request.evidence.map((evidence) => `${evidence.label} ${evidence.value}`)
      ]
        .join(" ")
        .toLowerCase();
      return matchesSource && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [items, query, sourceFilter]);

  const openItems = useMemo(() => filteredItems.filter((item) => !item.decision), [filteredItems]);
  const decidedItems = useMemo(
    () => filteredItems.filter((item) => item.decision),
    [filteredItems]
  );
  const failedCallbackItems = useMemo(
    () => items.filter((item) => item.decision && item.callback?.status === "failed"),
    [items]
  );
  const selectedItem = useMemo(
    () => items.find((item) => item.request.traceId === selectedTraceId) ?? decidedItems[0] ?? openItems[0],
    [decidedItems, items, openItems, selectedTraceId]
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.request.sourceApp))).sort(),
    [items]
  );

  async function loadQueue() {
    try {
      const body = await fetchReviewQueue();
      setItems(body.items ?? []);
      setNotice(`${body.items?.length ?? 0} external review request(s) loaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "External review queue unavailable.");
    }
  }

  async function createDecision(
    request: ExternalActionReviewRequest,
    decision: ExternalActionReviewDecision["decision"]
  ) {
    setPendingTraceId(request.traceId);
    try {
      await postDecision({
        callbackUrl: callbackUrlByTrace[request.traceId]?.trim() || undefined,
        decision,
        request
      });
      await loadQueue();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Decision creation failed.");
    } finally {
      setPendingTraceId("");
    }
  }

  async function sendDecisionCallback(item: ReviewQueueItem) {
    setPendingTraceId(item.request.traceId);
    try {
      await postDecisionCallback(
        item,
        callbackUrlByTrace[item.request.traceId]?.trim() || item.callback?.endpoint
      );
      await loadQueue();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Decision callback failed.");
    } finally {
      setPendingTraceId("");
    }
  }

  async function retryFailedCallbacks() {
    for (const item of failedCallbackItems) {
      await sendDecisionCallback(item);
    }
  }

  function setCallbackUrl(traceId: string, value: string) {
    setCallbackUrlByTrace((current) => ({ ...current, [traceId]: value }));
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  return {
    callbackUrlByTrace,
    createDecision,
    decidedItems,
    failedCallbackItems,
    notice,
    openItems,
    pendingTraceId,
    query,
    retryFailedCallbacks,
    selectedItem,
    sendDecisionCallback,
    setCallbackUrl,
    setQuery,
    setSelectedTraceId,
    setSourceFilter,
    sourceFilter,
    sourceOptions
  };
}
