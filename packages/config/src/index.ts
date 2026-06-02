import { defaultGuardrailPolicy } from "@guardrail/policy";
import { privacyDefaults } from "@guardrail/privacy";
import { providerCatalog } from "@guardrail/provider-config";

export const appMetadata = {
  name: "Guardrail by Tenra",
  repository: "Guardrail",
  localFirst: true,
  desktopFirst: true,
  primarySurface: "desktopapp"
} as const;

export const defaultPorts = {
  desktopUi: 1420,
  localApi: 4317,
  oauthCallback: 8765
} as const;

export const scaffoldDefaults = {
  policy: defaultGuardrailPolicy,
  privacy: privacyDefaults,
  providers: providerCatalog
} as const;
