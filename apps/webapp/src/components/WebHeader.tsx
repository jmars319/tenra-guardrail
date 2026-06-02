import { appMetadata } from "@guardrail/config";
import { guardrailStatement } from "@guardrail/ui";

export function WebHeader() {
  return (
    <section className="web-card">
      <p className="eyebrow">Web channel</p>
      <h1>{appMetadata.name}</h1>
      <p className="lead">
        Guardrail by Tenra is desktop-first. The web channel is reserved for remote visibility and
        secondary review flows.
      </p>
      <p>{guardrailStatement}</p>
    </section>
  );
}
