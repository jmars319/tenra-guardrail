import type { ExternalActionReviewRequest } from "@guardrail/api-contracts";
import { appMetadata, scaffoldDefaults } from "@guardrail/config";
import type {
  RuntimeBoundarySnapshot,
  RuntimeOverview,
  ToolRequest
} from "@guardrail/runtime-contracts";
import { desktopNavigation } from "@guardrail/ui";

export const fallbackSampleRequests: ToolRequest[] = [
  {
    id: "fallback-read-readme",
    kind: "read-file",
    path: "README.md",
    projectId: "guardrail-desktopapp",
    requestedAt: "0",
    surface: "desktop"
  },
  {
    id: "fallback-read-env",
    kind: "read-file",
    path: ".env",
    projectId: "guardrail-desktopapp",
    requestedAt: "0",
    surface: "desktop"
  },
  {
    id: "fallback-read-ssh",
    kind: "read-file",
    path: "~/.ssh/id_ed25519",
    projectId: "guardrail-desktopapp",
    requestedAt: "0",
    surface: "desktop"
  },
  {
    id: "fallback-shell",
    kind: "shell-command",
    command: "rm -rf /tmp/guardrail-test",
    projectId: "guardrail-desktopapp",
    requestedAt: "0",
    surface: "desktop"
  },
  {
    id: "fallback-network",
    kind: "network-request",
    method: "GET",
    projectId: "guardrail-desktopapp",
    requestedAt: "0",
    surface: "desktop",
    url: "https://api.openai.com/v1/models"
  }
];

export const suiteClientNavigation = [
  ...desktopNavigation,
  {
    id: "suite-clients",
    label: "Suite Clients",
    description: "Inspect how other tenra apps should enter the Tool Host boundary."
  }
];

export const suiteClientRequests: ToolRequest[] = [
  {
    id: "suite-registry-ledger-export",
    kind: "write-file",
    contents: "{\"source\":\"tenra Registry\",\"target\":\"tenra Ledger\"}",
    path: "exports/registry-ledger-handoff.json",
    projectId: "tenra-registry",
    requestedAt: "0",
    surface: "desktop"
  },
  {
    id: "suite-scout-evidence-read",
    kind: "read-file",
    path: "runs/latest/evidence-pack.json",
    projectId: "tenra-scout",
    requestedAt: "0",
    surface: "desktop"
  },
  {
    id: "suite-assembly-send-document",
    kind: "network-request",
    method: "POST",
    projectId: "tenra-assembly",
    requestedAt: "0",
    surface: "desktop",
    url: "https://example.invalid/send-document"
  },
  {
    id: "suite-proxy-profile-read",
    kind: "read-file",
    path: "profiles/default/profile.json",
    projectId: "tenra-proxy",
    requestedAt: "0",
    surface: "desktop"
  }
];

export const defaultExternalReviewRequest: ExternalActionReviewRequest = {
  schema: "tenra-guardrail.external-action-review.v1",
  exportedAt: "2026-05-06T17:30:00.000Z",
  sourceApp: "assembly",
  actionKind: "send-message",
  actorLabel: "Assembly document workflow",
  targetLabel: "Customer-facing past due notice",
  summary: "Assembly wants to send a Registry-generated customer notice after content review.",
  evidence: [
    {
      label: "Source schema",
      value: "tenra-registry.assembly-document-request.v1"
    }
  ],
  recommendedDecision: "review",
  traceId: "guardrail-fixture-external-action-review"
};

export const externalReviewQueueStorageKey = "tenra-guardrail-external-review-queue:v1";

export const fallbackOverview: RuntimeOverview = {
  productName: appMetadata.name,
  primarySurface: "desktop",
  runtimeShape: "headless-service",
  toolHostBoundary: "required",
  policyMode: "deterministic-deny-by-default",
  networkToolingEnabled: false,
  loadedPolicySource: "fallback-ui-state",
  auditEntryCount: 0
};

export const fallbackBoundarySnapshot: RuntimeBoundarySnapshot = {
  loadedPolicySource: "fallback-ui-state",
  policy: scaffoldDefaults.policy,
  sampleRequests: fallbackSampleRequests,
  auditEntries: []
};
