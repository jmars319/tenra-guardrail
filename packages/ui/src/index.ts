export interface DesktopNavItem {
  id: string;
  label: string;
  description: string;
}

export const desktopNavigation: DesktopNavItem[] = [
  {
    id: "provider-connections",
    label: "Provider Connections",
    description: "Configure model providers without bypassing runtime policy."
  },
  {
    id: "projects",
    label: "Projects",
    description: "Attach local workspaces to explicit Guardrail by Tenra profiles."
  },
  {
    id: "guardrail-profiles",
    label: "Guardrail by Tenra Profiles",
    description: "Review deterministic policy defaults and boundary posture."
  },
  {
    id: "sessions",
    label: "Sessions",
    description: "Observe runtime state and session status."
  },
  {
    id: "runtime-diagnostics",
    label: "Runtime Diagnostics",
    description: "Run boundary tests and inspect structured denial coaching."
  },
  {
    id: "approvals",
    label: "Approvals",
    description: "Inspect queued actions before anything sensitive executes."
  },
  {
    id: "settings",
    label: "Settings",
    description: "Manage local ports, updates, and environment posture."
  }
];

export const guardrailStatement =
  "Guardrail by Tenra is local-first and routes agent actions through a controlled Tool Host boundary.";
