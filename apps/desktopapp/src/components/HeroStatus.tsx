import type { RuntimeOverview } from "@guardrail/runtime-contracts";

interface HeroStatusProps {
  overview: RuntimeOverview;
  runtimeSource: "rust" | "fallback";
}

export function HeroStatus({ overview, runtimeSource }: HeroStatusProps) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Runtime Boundary</p>
        <h2>Local desktop shell, headless Rust runtime, explicit Tool Host</h2>
        <p className="hero-copy">
          tenra Guardrail loads a real policy, evaluates tool requests through the Tool Host,
          denies unsafe operations deterministically, and returns structured coaching instead
          of acting unsafely.
        </p>
      </div>

      <div className="status-grid">
        <StatusCard label="Policy mode" value={overview.policyMode} tone="neutral" />
        <StatusCard label="Tool Host" value={overview.toolHostBoundary} tone="safe" />
        <StatusCard
          label="Network tooling"
          value={overview.networkToolingEnabled ? "enabled" : "disabled"}
          tone="warning"
        />
        <StatusCard label="Policy source" value={overview.loadedPolicySource} tone="neutral" />
        <StatusCard label="Audit entries" value={String(overview.auditEntryCount)} tone="neutral" />
        <StatusCard label="Runtime source" value={runtimeSource} tone="neutral" />
      </div>
    </section>
  );
}

interface StatusCardProps {
  label: string;
  value: string;
  tone: "neutral" | "safe" | "warning";
}

function StatusCard({ label, value, tone }: StatusCardProps) {
  return (
    <article className={`status-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
