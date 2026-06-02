import { DecisionDetail } from "./components/DecisionDetail";
import { DecisionsPanel } from "./components/DecisionsPanel";
import { ReviewQueuePanel } from "./components/ReviewQueuePanel";
import { WebHeader } from "./components/WebHeader";
import { useReviewQueue } from "./hooks/useReviewQueue";

export default function App() {
  const queue = useReviewQueue();

  return (
    <main className="web-shell">
      <WebHeader />

      <section className="web-grid">
        <ReviewQueuePanel
          callbackUrlByTrace={queue.callbackUrlByTrace}
          createDecision={queue.createDecision}
          notice={queue.notice}
          onCallbackUrlChange={queue.setCallbackUrl}
          openItems={queue.openItems}
          pendingTraceId={queue.pendingTraceId}
          query={queue.query}
          setQuery={queue.setQuery}
          setSourceFilter={queue.setSourceFilter}
          sourceFilter={queue.sourceFilter}
          sourceOptions={queue.sourceOptions}
        />
        <DecisionsPanel
          callbackUrlByTrace={queue.callbackUrlByTrace}
          decidedItems={queue.decidedItems}
          failedCallbackItems={queue.failedCallbackItems}
          onCallbackUrlChange={queue.setCallbackUrl}
          pendingTraceId={queue.pendingTraceId}
          retryFailedCallbacks={queue.retryFailedCallbacks}
          sendDecisionCallback={queue.sendDecisionCallback}
          setSelectedTraceId={queue.setSelectedTraceId}
        />
      </section>

      {queue.selectedItem ? <DecisionDetail item={queue.selectedItem} /> : null}
    </main>
  );
}
