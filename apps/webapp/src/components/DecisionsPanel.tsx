import type { ReviewQueueItem } from "../reviewTypes";

interface DecisionsPanelProps {
  callbackUrlByTrace: Record<string, string>;
  decidedItems: ReviewQueueItem[];
  failedCallbackItems: ReviewQueueItem[];
  onCallbackUrlChange: (traceId: string, value: string) => void;
  pendingTraceId: string;
  retryFailedCallbacks: () => void;
  sendDecisionCallback: (item: ReviewQueueItem) => void;
  setSelectedTraceId: (traceId: string) => void;
}

export function DecisionsPanel({
  callbackUrlByTrace,
  decidedItems,
  failedCallbackItems,
  onCallbackUrlChange,
  pendingTraceId,
  retryFailedCallbacks,
  sendDecisionCallback,
  setSelectedTraceId
}: DecisionsPanelProps) {
  return (
    <article className="web-panel">
      <h2>Decisions</h2>
      {failedCallbackItems.length ? (
        <div className="retry-banner">
          <span>{failedCallbackItems.length} failed callback(s)</span>
          <button disabled={Boolean(pendingTraceId)} onClick={retryFailedCallbacks} type="button">
            Retry failed
          </button>
        </div>
      ) : null}
      <div className="queue-stack">
        {decidedItems.length ? (
          decidedItems.slice(0, 8).map((item) => (
            <DecisionItem
              callbackUrl={callbackUrlByTrace[item.request.traceId] ?? item.callback?.endpoint ?? ""}
              item={item}
              key={`${item.request.traceId}-decision`}
              onCallbackUrlChange={onCallbackUrlChange}
              pendingTraceId={pendingTraceId}
              sendDecisionCallback={sendDecisionCallback}
              setSelectedTraceId={setSelectedTraceId}
            />
          ))
        ) : (
          <p>No decisions have been created yet.</p>
        )}
      </div>
    </article>
  );
}

function DecisionItem({
  callbackUrl,
  item,
  onCallbackUrlChange,
  pendingTraceId,
  sendDecisionCallback,
  setSelectedTraceId
}: {
  callbackUrl: string;
  item: ReviewQueueItem;
  onCallbackUrlChange: (traceId: string, value: string) => void;
  pendingTraceId: string;
  sendDecisionCallback: (item: ReviewQueueItem) => void;
  setSelectedTraceId: (traceId: string) => void;
}) {
  return (
    <div className="queue-item">
      <div>
        <strong>{item.decision?.decision}</strong>
        <span>{item.decision?.sourceReturn.expectedSchema}</span>
      </div>
      <p>{item.decision?.reason}</p>
      {item.callback ? (
        <p>
          Callback: {item.callback.status}
          {item.callback.message ? ` - ${item.callback.message}` : ""}
        </p>
      ) : null}
      <label className="callback-field">
        <span>Callback endpoint</span>
        <input
          onChange={(event) => onCallbackUrlChange(item.request.traceId, event.currentTarget.value)}
          placeholder="Optional source app decision endpoint"
          value={callbackUrl}
        />
      </label>
      <div className="button-row">
        <button onClick={() => setSelectedTraceId(item.request.traceId)} type="button">
          Details
        </button>
        <button
          disabled={pendingTraceId === item.request.traceId}
          onClick={() => sendDecisionCallback(item)}
          type="button"
        >
          Send callback
        </button>
      </div>
    </div>
  );
}
