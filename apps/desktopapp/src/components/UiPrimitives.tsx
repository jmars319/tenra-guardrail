import type { ReactNode } from "react";

interface PanelProps {
  activeSection: string;
  children: ReactNode;
  id: string;
  subtitle: string;
  title: string;
}

export function Panel({ activeSection, children, id, subtitle, title }: PanelProps) {
  return (
    <section className={id === activeSection ? "panel active" : "panel"}>
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

interface StatusPillProps {
  children: ReactNode;
  tone: "safe" | "warning";
}

export function StatusPill({ children, tone }: StatusPillProps) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

interface SummaryMetricProps {
  label: string;
  value: string;
}

export function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
