import { downloadJsonFile } from "../reviewApi";
import type { ReviewQueueItem } from "../reviewTypes";

export function DecisionDetail({ item }: { item: ReviewQueueItem }) {
  return (
    <section className="web-panel decision-detail">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">Decision detail</p>
          <h2>{item.request.traceId}</h2>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadJsonFile(
              {
                schema: "tenra-guardrail.external-review-detail.v1",
                exportedAt: new Date().toISOString(),
                request: item.request,
                decision: item.decision ?? null,
                callback: item.callback ?? null
              },
              `${item.request.traceId}-guardrail-review.json`
            )
          }
        >
          Export JSON
        </button>
      </div>
      <div className="detail-grid">
        <div>
          <span>Source</span>
          <strong>{item.request.sourceApp}</strong>
        </div>
        <div>
          <span>Action</span>
          <strong>{item.request.actionKind}</strong>
        </div>
        <div>
          <span>Decision</span>
          <strong>{item.decision?.decision ?? "pending"}</strong>
        </div>
        <div>
          <span>Callback</span>
          <strong>{item.callback?.status ?? "not configured"}</strong>
        </div>
      </div>
      <pre>{JSON.stringify({ request: item.request, decision: item.decision, callback: item.callback }, null, 2)}</pre>
    </section>
  );
}
