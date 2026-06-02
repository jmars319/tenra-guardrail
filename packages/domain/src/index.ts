import type { EntityId, IsoTimestamp } from "@guardrail/shared-types";

export type ProviderKind = "openai" | "anthropic" | "custom";

export interface ProviderConnectionSummary {
  id: EntityId<"providerConnection">;
  provider: ProviderKind;
  label: string;
  status: "disconnected" | "configured" | "healthy";
}

export interface ProjectSummary {
  id: EntityId<"project">;
  name: string;
  profileId: EntityId<"guardrailProfile">;
  lastOpenedAt: IsoTimestamp;
}

export interface GuardrailProfileSummary {
  id: EntityId<"guardrailProfile">;
  name: string;
  description: string;
  policyMode: "deny-by-default";
}

export interface SessionSummary {
  id: EntityId<"session">;
  projectId: EntityId<"project">;
  startedAt: IsoTimestamp;
  status: "idle" | "running" | "awaiting-approval" | "blocked";
}

export interface ApprovalRequestSummary {
  id: EntityId<"approval">;
  sessionId: EntityId<"session">;
  capability: "filesystem.write" | "process.spawn" | "network.http";
  status: "pending" | "approved" | "denied";
}

export const seededProviders: ProviderConnectionSummary[] = [
  {
    id: "provider-connection-openai" as EntityId<"providerConnection">,
    provider: "openai",
    label: "OpenAI",
    status: "disconnected"
  },
  {
    id: "provider-connection-anthropic" as EntityId<"providerConnection">,
    provider: "anthropic",
    label: "Anthropic",
    status: "disconnected"
  }
];

export const seededProfiles: GuardrailProfileSummary[] = [
  {
    id: "profile-default" as EntityId<"guardrailProfile">,
    name: "Default Guardrail by Tenra",
    description: "Deterministic deny-by-default runtime profile.",
    policyMode: "deny-by-default"
  },
  {
    id: "profile-review-heavy" as EntityId<"guardrailProfile">,
    name: "Review Heavy",
    description: "Queue all sensitive actions for approval before execution.",
    policyMode: "deny-by-default"
  }
];

export const seededProjects: ProjectSummary[] = [
  {
    id: "project-guardrail-app" as EntityId<"project">,
    name: "Guardrail by Tenra Desktop",
    profileId: "profile-default" as EntityId<"guardrailProfile">,
    lastOpenedAt: "2026-03-15T09:00:00.000Z" as IsoTimestamp
  },
  {
    id: "project-agent-lab" as EntityId<"project">,
    name: "Agent Lab",
    profileId: "profile-review-heavy" as EntityId<"guardrailProfile">,
    lastOpenedAt: "2026-03-14T18:20:00.000Z" as IsoTimestamp
  }
];

export const seededSessions: SessionSummary[] = [
  {
    id: "session-active" as EntityId<"session">,
    projectId: "project-guardrail-app" as EntityId<"project">,
    startedAt: "2026-03-15T12:15:00.000Z" as IsoTimestamp,
    status: "running"
  },
  {
    id: "session-review" as EntityId<"session">,
    projectId: "project-agent-lab" as EntityId<"project">,
    startedAt: "2026-03-15T10:42:00.000Z" as IsoTimestamp,
    status: "awaiting-approval"
  }
];

export const seededApprovals: ApprovalRequestSummary[] = [
  {
    id: "approval-network" as EntityId<"approval">,
    sessionId: "session-review" as EntityId<"session">,
    capability: "network.http",
    status: "pending"
  }
];
