function Bar({ width, height = 12, round = false }) {
  return (
    <span
      className={`skeleton${round ? " skeleton--round" : ""}`}
      style={{ width, height }}
    />
  );
}

export function FleetRowsSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-live="polite" className="skeleton-group">
      <span className="visually-hidden">Loading your trucks…</span>
      <ul className="fleet-list" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="fleet-row fleet-row--skeleton">
            <div className="fleet-row__line">
              <div className="fleet-row__type">
                <Bar width="45%" height={14} />
                <Bar width="30%" height={10} />
              </div>
              <Bar width={131} height={33} />
              <div className="fleet-row__availability">
                <Bar width={118} height={33} round />
              </div>
              <Bar width={16} height={16} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TruckDetailsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="skeleton-group">
      <span className="visually-hidden">Loading truck…</span>
      <div aria-hidden="true">
        <div className="details-hero">
          <Bar width={140} height={80} />
          <div className="skeleton-stack">
            <Bar width={120} height={22} />
            <Bar width={150} height={14} />
            <Bar width={80} height={22} round />
          </div>
        </div>
        <div className="skeleton-section">
          <Bar width={110} height={10} />
          <div className="details-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton-stack">
                <Bar width="55%" height={10} />
                <Bar width="75%" height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
