import type { ExternalActionReviewDecision } from "@guardrail/api-contracts";
import type { ReviewQueueItem } from "../reviewTypes";

interface ReviewQueuePanelProps {
  callbackUrlByTrace: Record<string, string>;
  createDecision: (
    request: ReviewQueueItem["request"],
    decision: ExternalActionReviewDecision["decision"]
  ) => void;
  notice: string;
  onCallbackUrlChange: (traceId: string, value: string) => void;
  openItems: ReviewQueueItem[];
  pendingTraceId: string;
  query: string;
  setQuery: (query: string) => void;
  setSourceFilter: (source: string) => void;
  sourceFilter: string;
  sourceOptions: string[];
}

export function ReviewQueuePanel({
  callbackUrlByTrace,
  createDecision,
  notice,
  onCallbackUrlChange,
  openItems,
  pendingTraceId,
  query,
  setQuery,
  setSourceFilter,
  sourceFilter,
  sourceOptions
}: ReviewQueuePanelProps) {
  return (
    <article className="web-panel">
      <h2>External Review Queue</h2>
      <p>{notice}</p>
      <QueueFilters
        query={query}
        setQuery={setQuery}
        setSourceFilter={setSourceFilter}
        sourceFilter={sourceFilter}
        sourceOptions={sourceOptions}
      />
      <div className="queue-stack">
        {openItems.length ? (
          openItems.map((item) => (
            <OpenReviewItem
              callbackUrl={callbackUrlByTrace[item.request.traceId] ?? item.callback?.endpoint ?? ""}
              createDecision={createDecision}
              item={item}
              onCallbackUrlChange={onCallbackUrlChange}
              pendingTraceId={pendingTraceId}
              key={item.request.traceId}
            />
          ))
        ) : (
          <p>No pending external action requests.</p>
        )}
      </div>
    </article>
  );
}

function QueueFilters({
  query,
  setQuery,
  setSourceFilter,
  sourceFilter,
  sourceOptions
}: {
  query: string;
  setQuery: (query: string) => void;
  setSourceFilter: (source: string) => void;
  sourceFilter: string;
  sourceOptions: string[];
}) {
  return (
    <div className="filter-row">
      <input
        aria-label="Search review queue"
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search source, target, evidence"
        value={query}
      />
      <select
        aria-label="Filter by source app"
        onChange={(event) => setSourceFilter(event.currentTarget.value)}
        value={sourceFilter}
      >
        <option value="all">All source apps</option>
        {sourceOptions.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>
    </div>
  );
}

function OpenReviewItem({
  callbackUrl,
  createDecision,
  item,
  onCallbackUrlChange,
  pendingTraceId
}: {
  callbackUrl: string;
  createDecision: (
    request: ReviewQueueItem["request"],
    decision: ExternalActionReviewDecision["decision"]
  ) => void;
  item: ReviewQueueItem;
  onCallbackUrlChange: (traceId: string, value: string) => void;
  pendingTraceId: string;
}) {
  return (
    <div className="queue-item">
      <div>
        <strong>{item.request.targetLabel}</strong>
        <span>
          {item.request.sourceApp} / {item.request.actionKind}
        </span>
      </div>
      <p>{item.request.summary}</p>
      <ul>
        {item.request.evidence.slice(0, 4).map((evidence) => (
          <li key={`${item.request.traceId}-${evidence.label}`}>
            {evidence.label}: {evidence.value}
          </li>
        ))}
      </ul>
      <label className="callback-field">
        <span>Decision callback endpoint</span>
        <input
          onChange={(event) => onCallbackUrlChange(item.request.traceId, event.currentTarget.value)}
          placeholder="Optional source app decision endpoint"
          value={callbackUrl}
        />
      </label>
      <div className="button-row">
        {(["allow", "review", "deny"] as const).map((decision) => (
          <button
            disabled={pendingTraceId === item.request.traceId}
            key={decision}
            onClick={() => createDecision(item.request, decision)}
            type="button"
          >
            {decision}
          </button>
        ))}
      </div>
    </div>
  );
}
