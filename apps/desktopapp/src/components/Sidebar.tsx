import type { DesktopNavItem } from "@guardrail/ui";

interface SidebarProps {
  activeSection: string;
  appName: string;
  navigation: DesktopNavItem[];
  onSelectSection: (section: string) => void;
  statement: string;
}

export function Sidebar({
  activeSection,
  appName,
  navigation,
  onSelectSection,
  statement
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-card">
        <p className="eyebrow">Primary Surface</p>
        <h1>{appName}</h1>
        <p>{statement}</p>
      </div>

      <nav className="nav-list" aria-label="tenra Guardrail sections">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={item.id === activeSection ? "nav-item active" : "nav-item"}
            onClick={() => onSelectSection(item.id)}
            type="button"
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
