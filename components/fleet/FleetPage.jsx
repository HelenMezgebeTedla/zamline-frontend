"use client";

import FleetSidebar from "@/components/fleet/FleetSidebar";
import { useRequireRole } from "@/hooks/useRequireRole";
import "./FleetPage.css";

export default function FleetPage({ active, children }) {
  const allowed = useRequireRole("fleet", { requireVerified: true });

  if (!allowed) {
    return (
      <div className="fleet-shell-loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="fleet-shell">
      <FleetSidebar active={active} />
      <main className="fleet-main">{children}</main>
    </div>
  );
}

export function FleetHeader({ eyebrow, title, subtitle, aside }) {
  return (
    <header className="fleet-header">
      <div>
        <p className="fleet-eyebrow">{eyebrow}</p>
        <h1 className="fleet-title">{title}</h1>
        {subtitle && <p className="fleet-subtitle">{subtitle}</p>}
      </div>
      {aside}
    </header>
  );
}

export function FleetRequestState({
  request,
  loadingText,
  unavailableTitle = "Not available yet",
  unavailableText = "This information will appear here once it is available.",
}) {
  if (request.status === "loading") {
    return <p className="fleet-loading-text">{loadingText}</p>;
  }
  return (
    <div className="fleet-empty">
      <h2>{unavailableTitle}</h2>
      <p>{unavailableText}</p>
      <button
        type="button"
        className="fleet-button is-outline"
        onClick={request.reload}
      >
        Refresh
      </button>
    </div>
  );
}
