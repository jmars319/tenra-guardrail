import { defaultPorts } from "@guardrail/config";
import {
  seededApprovals,
  seededProfiles,
  seededProjects,
  seededProviders,
  seededSessions
} from "@guardrail/domain";
import type { GuardrailPolicy } from "@guardrail/policy";
import { privacyDefaults } from "@guardrail/privacy";
import { providerCatalog } from "@guardrail/provider-config";
import { secretPatternCatalog } from "@guardrail/secrets";
import { Panel, StatusPill, SummaryMetric } from "./UiPrimitives";

interface ActiveSectionProps {
  activeSection: string;
}

export function ProviderConnectionsPanel({ activeSection }: ActiveSectionProps) {
  return (
    <Panel
      id="provider-connections"
      activeSection={activeSection}
      title="Provider Connections"
      subtitle="Configured locally. Disabled by default until policy permits use."
    >
      {providerCatalog.map((provider) => {
        const seeded = seededProviders.find((entry) => entry.provider === provider.id);

        return (
          <article key={provider.id} className="list-row">
            <div>
              <strong>{provider.label}</strong>
              <p>{provider.notes}</p>
            </div>
            <StatusPill tone="warning">{seeded?.status ?? "disconnected"}</StatusPill>
          </article>
        );
      })}
    </Panel>
  );
}

export function ProjectsPanel({ activeSection }: ActiveSectionProps) {
  return (
    <Panel
      id="projects"
      activeSection={activeSection}
      title="Projects"
      subtitle="Local workspaces attach to explicit profiles instead of implicit trust."
    >
      {seededProjects.map((project) => (
        <article key={project.id} className="list-row">
          <div>
            <strong>{project.name}</strong>
            <p>Profile: {project.profileId}</p>
          </div>
          <span className="meta-chip">{project.lastOpenedAt}</span>
        </article>
      ))}
    </Panel>
  );
}

export function ProfilesPanel({
  activeSection,
  policy
}: ActiveSectionProps & { policy: GuardrailPolicy }) {
  return (
    <Panel
      id="guardrail-profiles"
      activeSection={activeSection}
      title="tenra Guardrail Profiles"
      subtitle="Profiles expose concrete boundary posture instead of prompt-only safety."
    >
      {seededProfiles.map((profile) => (
        <article key={profile.id} className="list-row">
          <div>
            <strong>{profile.name}</strong>
            <p>{profile.description}</p>
          </div>
          <StatusPill tone="safe">{profile.policyMode}</StatusPill>
        </article>
      ))}

      <div className="summary-block">
        <span>Blocked path patterns</span>
        <strong>{policy.deniedPaths.join(", ")}</strong>
      </div>

      <div className="summary-block">
        <span>Protected paths</span>
        <strong>{policy.protectedPaths.join(", ")}</strong>
      </div>
    </Panel>
  );
}

export function SessionsPanel({ activeSection }: ActiveSectionProps) {
  return (
    <Panel
      id="sessions"
      activeSection={activeSection}
      title="Sessions"
      subtitle="Runtime session state stays separate from the UI wrapper."
    >
      {seededSessions.map((session) => (
        <article key={session.id} className="list-row">
          <div>
            <strong>{session.id}</strong>
            <p>Project: {session.projectId}</p>
          </div>
          <StatusPill tone={session.status === "awaiting-approval" ? "warning" : "safe"}>
            {session.status}
          </StatusPill>
        </article>
      ))}
    </Panel>
  );
}

export function ApprovalsPanel({
  activeSection,
  protectedPaths
}: ActiveSectionProps & { protectedPaths: string[] }) {
  return (
    <Panel
      id="approvals"
      activeSection={activeSection}
      title="Approvals"
      subtitle="Approval flow is reserved for a later release. Protected targets are denied explicitly for now."
    >
      {seededApprovals.map((approval) => (
        <article key={approval.id} className="list-row">
          <div>
            <strong>{approval.capability}</strong>
            <p>Session: {approval.sessionId}</p>
          </div>
          <StatusPill tone="warning">{approval.status}</StatusPill>
        </article>
      ))}

      <div className="summary-block">
        <span>Current protected paths</span>
        <strong>{protectedPaths.join(", ")}</strong>
      </div>
    </Panel>
  );
}

export function SettingsPanel({ activeSection }: ActiveSectionProps) {
  return (
    <Panel
      id="settings"
      activeSection={activeSection}
      title="Settings"
      subtitle="Configuration remains explicit, local, and minimally surprising."
    >
      <div className="settings-grid">
        <SummaryMetric label="Desktop UI port" value={String(defaultPorts.desktopUi)} />
        <SummaryMetric label="Local API port" value={String(defaultPorts.localApi)} />
        <SummaryMetric label="Privacy mode" value={privacyDefaults.defaultMode} />
        <SummaryMetric label="Secret detectors" value={String(secretPatternCatalog.length)} />
      </div>
    </Panel>
  );
}
