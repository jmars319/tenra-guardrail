import type {
  ExternalActionReviewDecisionValue,
  ExternalActionReviewRequest
} from "@guardrail/api-contracts";
import type { ToolRequest } from "@guardrail/runtime-contracts";
import { describeRequest, describeTarget } from "../formatters";
import { suiteClientRequests } from "../guardrailData";
import type { ExternalReviewQueueItem } from "../hooks/useExternalReviewQueue";
import { Panel } from "./UiPrimitives";

interface SuiteClientsPanelProps {
  activeSection: string;
  externalReview: ExternalActionReviewRequest | null;
  externalReviewErrors: string[];
  externalReviewQueue: ExternalReviewQueueItem[];
  externalReviewText: string;
  lastExternalDecisionJson: string;
  onDecideExternalReview: (
    request: ExternalActionReviewRequest,
    decision: ExternalActionReviewDecisionValue
  ) => void;
  onExternalReviewTextChange: (text: string) => void;
  onImportExternalReview: () => void;
  requestRunning: boolean;
  runRequest: (request: ToolRequest) => void;
  runtimeSource: "rust" | "fallback";
}

// Suite request boundary
export function SuiteClientsPanel({
  activeSection,
  externalReview,
  externalReviewErrors,
  externalReviewQueue,
  externalReviewText,
  lastExternalDecisionJson,
  onDecideExternalReview,
  onExternalReviewTextChange,
  onImportExternalReview,
  requestRunning,
  runRequest,
  runtimeSource
}: SuiteClientsPanelProps) {
  return (
    <Panel
      id="suite-clients"
      activeSection={activeSection}
      title="Suite Client Requests"
      subtitle="Other tenra apps should ask Guardrail before file writes, evidence reads, network sends, or profile access."
    >
      <div className="diagnostic-stack">
        <SuiteRequestList
          requestRunning={requestRunning}
          runRequest={runRequest}
          runtimeSource={runtimeSource}
        />
        <ExternalReviewSummary externalReview={externalReview} />
        <ExternalReviewImporter
          errors={externalReviewErrors}
          onImport={onImportExternalReview}
          onTextChange={onExternalReviewTextChange}
          text={externalReviewText}
        />
        <ExternalReviewQueue
          lastExternalDecisionJson={lastExternalDecisionJson}
          onDecide={onDecideExternalReview}
          queue={externalReviewQueue}
        />
      </div>
    </Panel>
  );
}

// Policy exercise boundary
function SuiteRequestList({
  requestRunning,
  runRequest,
  runtimeSource
}: {
  requestRunning: boolean;
  runRequest: (request: ToolRequest) => void;
  runtimeSource: "rust" | "fallback";
}) {
  return (
    <>
      {suiteClientRequests.map((request) => (
        <article key={request.id} className="list-row">
          <div>
            <strong>{request.projectId}</strong>
            <p>
              {describeRequest(request)} · {describeTarget(request)}
            </p>
          </div>
          <button
            className="request-button"
            disabled={runtimeSource !== "rust" || requestRunning}
            onClick={() => runRequest(request)}
            type="button"
          >
            Test
          </button>
        </article>
      ))}
      <div className="summary-block">
        <span>Boundary rule</span>
        <strong>Suite apps must send structured requests instead of bypassing policy locally.</strong>
      </div>
    </>
  );
}

// External review boundary
function ExternalReviewSummary({
  externalReview
}: {
  externalReview: ExternalActionReviewRequest | null;
}) {
  return (
    <div className="summary-block">
      <span>External action review</span>
      <strong>
        {externalReview
          ? `${externalReview.sourceApp} / ${externalReview.actionKind} / ${
              externalReview.recommendedDecision ?? "review"
            }`
          : "No valid review loaded"}
      </strong>
    </div>
  );
}

function ExternalReviewImporter({
  errors,
  onImport,
  onTextChange,
  text
}: {
  errors: string[];
  onImport: () => void;
  onTextChange: (text: string) => void;
  text: string;
}) {
  return (
    <>
      <label className="review-import">
        <span>Review request JSON</span>
        <textarea value={text} onChange={(event) => onTextChange(event.target.value)} />
      </label>
      <button className="request-button" type="button" onClick={onImport}>
        Import External Review
      </button>
      {errors.length > 0 ? (
        <ul className="checklist">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

// Decision queue boundary
function ExternalReviewQueue({
  lastExternalDecisionJson,
  onDecide,
  queue
}: {
  lastExternalDecisionJson: string;
  onDecide: (
    request: ExternalActionReviewRequest,
    decision: ExternalActionReviewDecisionValue
  ) => void;
  queue: ExternalReviewQueueItem[];
}) {
  return (
    <>
      <div className="summary-block">
        <span>Saved review queue</span>
        <strong>{queue.length} request(s)</strong>
      </div>
      <div className="review-queue">
        {queue.map((item) => (
          <article key={item.request.traceId} className="list-row review-queue-item">
            <div>
              <strong>{item.request.targetLabel}</strong>
              <p>
                {item.request.sourceApp} · {item.request.actionKind} ·{" "}
                {item.decision ? item.decision.decision : item.request.recommendedDecision ?? "review"}
              </p>
              <small>{item.request.summary}</small>
            </div>
            <div className="decision-actions">
              {(["allow", "review", "deny"] as const).map((decision) => (
                <button
                  key={decision}
                  className="request-button"
                  type="button"
                  onClick={() => onDecide(item.request, decision)}
                >
                  {decision}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {lastExternalDecisionJson ? (
        <pre className="preview-block">{lastExternalDecisionJson}</pre>
      ) : null}
    </>
  );
}
