import { appMetadata } from "@guardrail/config";
import { guardrailStatement } from "@guardrail/ui";
import { HeroStatus } from "./components/HeroStatus";
import { Sidebar } from "./components/Sidebar";
import {
  ApprovalsPanel,
  ProfilesPanel,
  ProjectsPanel,
  ProviderConnectionsPanel,
  SessionsPanel,
  SettingsPanel
} from "./components/StaticPanels";
import { RuntimeDiagnosticsPanel } from "./components/RuntimeDiagnosticsPanel";
import { SuiteClientsPanel } from "./components/SuiteClientsPanel";
import { useExternalReviewQueue } from "./hooks/useExternalReviewQueue";
import { useRuntimeBoundary } from "./hooks/useRuntimeBoundary";
import { suiteClientNavigation } from "./guardrailData";

export default function App() {
  const runtime = useRuntimeBoundary();
  const externalReview = useExternalReviewQueue();

  return (
    <div className="desktop-shell">
      <Sidebar
        activeSection={runtime.activeSection}
        appName={appMetadata.name}
        navigation={suiteClientNavigation}
        onSelectSection={runtime.setActiveSection}
        statement={guardrailStatement}
      />

      <main className="content">
        <HeroStatus
          overview={runtime.overview}
          runtimeSource={runtime.runtimeSource}
        />

        <section className="panel-grid">
          <ProviderConnectionsPanel activeSection={runtime.activeSection} />
          <ProjectsPanel activeSection={runtime.activeSection} />
          <ProfilesPanel
            activeSection={runtime.activeSection}
            policy={runtime.boundarySnapshot.policy}
          />
          <SessionsPanel activeSection={runtime.activeSection} />
          <RuntimeDiagnosticsPanel
            activeSection={runtime.activeSection}
            auditEntries={runtime.auditEntries}
            boundarySnapshot={runtime.boundarySnapshot}
            exportRuntimeSnapshot={runtime.exportRuntimeSnapshot}
            lastResult={runtime.lastResult}
            requestRunning={runtime.requestRunning}
            runRequest={runtime.runRequest}
            runtimeSource={runtime.runtimeSource}
            selectedRequest={runtime.selectedRequest}
            selectedRequestId={runtime.selectedRequestId}
          />
          <SuiteClientsPanel
            activeSection={runtime.activeSection}
            externalReview={externalReview.externalReview}
            externalReviewErrors={externalReview.externalReviewErrors}
            externalReviewQueue={externalReview.externalReviewQueue}
            externalReviewText={externalReview.externalReviewText}
            lastExternalDecisionJson={externalReview.lastExternalDecisionJson}
            onDecideExternalReview={externalReview.decideExternalReview}
            onExternalReviewTextChange={externalReview.setExternalReviewText}
            onImportExternalReview={externalReview.importExternalReview}
            requestRunning={runtime.requestRunning}
            runRequest={runtime.runRequest}
            runtimeSource={runtime.runtimeSource}
          />
          <ApprovalsPanel
            activeSection={runtime.activeSection}
            protectedPaths={runtime.boundarySnapshot.policy.protectedPaths}
          />
          <SettingsPanel activeSection={runtime.activeSection} />
        </section>
      </main>
    </div>
  );
}
