import type {
  AuditLogEntry,
  RuntimeBoundarySnapshot,
  ToolExecutionResponse,
  ToolRequest
} from "@guardrail/runtime-contracts";
import {
  describeRequest,
  describeTarget,
  formatTimestamp,
  isDenied
} from "../formatters";
import { Panel } from "./UiPrimitives";

interface RuntimeDiagnosticsPanelProps {
  activeSection: string;
  auditEntries: AuditLogEntry[];
  boundarySnapshot: RuntimeBoundarySnapshot;
  exportRuntimeSnapshot: () => void;
  lastResult: ToolExecutionResponse | null;
  requestRunning: boolean;
  runRequest: (request: ToolRequest) => void;
  runtimeSource: "rust" | "fallback";
  selectedRequest: ToolRequest | null;
  selectedRequestId: string;
}

export function RuntimeDiagnosticsPanel({
  activeSection,
  auditEntries,
  boundarySnapshot,
  exportRuntimeSnapshot,
  lastResult,
  requestRunning,
  runRequest,
  runtimeSource,
  selectedRequest,
  selectedRequestId
}: RuntimeDiagnosticsPanelProps) {
  return (
    <Panel
      id="runtime-diagnostics"
      activeSection={activeSection}
      title="Runtime Diagnostics"
      subtitle="Developer-facing boundary test surface backed by the real Tool Host."
    >
      <div className="diagnostic-stack">
        <div className="summary-block">
          <span>Loaded project roots</span>
          <strong>{boundarySnapshot.policy.projectRoots.join(", ")}</strong>
        </div>

        <div className="summary-block">
          <span>Network enabled</span>
          <strong>{String(boundarySnapshot.policy.networkEnabled)}</strong>
        </div>

        <button className="request-button" type="button" onClick={exportRuntimeSnapshot}>
          <span>Export runtime snapshot</span>
          <small>Policy, current overview, audit entries, and last allow/deny payload</small>
        </button>

        <RequestActions
          requests={boundarySnapshot.sampleRequests}
          requestRunning={requestRunning}
          runRequest={runRequest}
          runtimeSource={runtimeSource}
          selectedRequestId={selectedRequestId}
        />

        {runtimeSource !== "rust" ? (
          <p className="diagnostic-note">
            Runtime diagnostics require the Tauri runtime. Launch via{" "}
            <code>pnpm dev:desktop</code> to execute the real boundary.
          </p>
        ) : null}

        {selectedRequest ? (
          <div className="summary-block">
            <span>Selected request</span>
            <strong>{describeRequest(selectedRequest)}</strong>
          </div>
        ) : null}

        <DecisionResult lastResult={lastResult} />
        <AuditEntries auditEntries={auditEntries} />
      </div>
    </Panel>
  );
}

function RequestActions({
  requests,
  requestRunning,
  runRequest,
  runtimeSource,
  selectedRequestId
}: {
  requests: ToolRequest[];
  requestRunning: boolean;
  runRequest: (request: ToolRequest) => void;
  runtimeSource: "rust" | "fallback";
  selectedRequestId: string;
}) {
  return (
    <div className="request-actions">
      {requests.map((request) => (
        <button
          key={request.id}
          className={request.id === selectedRequestId ? "request-button active" : "request-button"}
          disabled={runtimeSource !== "rust" || requestRunning}
          onClick={() => runRequest(request)}
          type="button"
        >
          <span>{describeRequest(request)}</span>
          <small>{describeTarget(request)}</small>
        </button>
      ))}
    </div>
  );
}

function DecisionResult({ lastResult }: { lastResult: ToolExecutionResponse | null }) {
  if (!lastResult) {
    return (
      <p className="diagnostic-note">
        Run one of the sample requests above to see a real allow or deny payload from the Tool Host.
      </p>
    );
  }

  if (!isDenied(lastResult)) {
    return (
      <article className="decision-card allowed">
        <p className="eyebrow">Allowed</p>
        <h3>{lastResult.summary}</h3>
        <p>
          This request was allowed because it stayed inside trusted scope and did not cross a
          blocked capability boundary.
        </p>
        {lastResult.outputPreview ? (
          <pre className="preview-block">{lastResult.outputPreview}</pre>
        ) : null}
      </article>
    );
  }

  return (
    <article className="decision-card denied">
      <p className="eyebrow">Denied</p>
      <h3>{lastResult.reason}</h3>
      <p>{lastResult.userInstructions}</p>
      <div className="result-meta">
        <span>Risk: {lastResult.riskCategory}</span>
        <span>Rule: {lastResult.policyRule}</span>
      </div>
      <p className="decision-target">
        Target: <code>{lastResult.targetSummary}</code>
      </p>
      <ul className="checklist">
        {lastResult.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function AuditEntries({ auditEntries }: { auditEntries: AuditLogEntry[] }) {
  return (
    <div className="audit-list">
      {auditEntries.length > 0 ? (
        auditEntries.map((entry) => (
          <article key={`${entry.timestampMs}-${entry.targetSummary}`} className="audit-entry">
            <div>
              <strong>{entry.requestKind}</strong>
              <p>{entry.targetSummary}</p>
            </div>
            <div className="audit-meta">
              <span>{entry.result}</span>
              <small>{formatTimestamp(entry.timestampMs)}</small>
            </div>
          </article>
        ))
      ) : (
        <p className="diagnostic-note">
          Audit entries appear here after a request passes through the Tool Host.
        </p>
      )}
    </div>
  );
}
