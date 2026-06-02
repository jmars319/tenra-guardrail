export interface ProviderDefinition {
  id: "openai" | "anthropic";
  label: string;
  apiBaseUrlEnv: "OPENAI_API_BASE_URL" | "ANTHROPIC_API_BASE_URL";
  enabledByDefault: false;
  networkToolsEnabledByDefault: false;
  notes: string;
}

export const providerCatalog: ProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    apiBaseUrlEnv: "OPENAI_API_BASE_URL",
    enabledByDefault: false,
    networkToolsEnabledByDefault: false,
    notes: "Provider can be configured locally, but network-capable tooling stays disabled until policy changes."
  },
  {
    id: "anthropic",
    label: "Anthropic",
    apiBaseUrlEnv: "ANTHROPIC_API_BASE_URL",
    enabledByDefault: false,
    networkToolsEnabledByDefault: false,
    notes: "Provider connector is defined for local setup. Runtime access remains deny-by-default."
  }
];
