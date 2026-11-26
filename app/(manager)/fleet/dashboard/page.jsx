"use client";

import Link from "next/link";
import { useState } from "react";
import FleetPage, {
  FleetHeader,
  FleetRequestState,
} from "@/components/fleet/FleetPage";
import { ArrowIcon, CalendarIcon, PinIcon } from "@/components/fleet/icons";
import { useRequest } from "@/hooks/useRequest";
import { fetchCompany, hasCostSettings } from "@/lib/fleet/account";
import {
  formatKg,
  formatLabel,
  formatPickup,
  formatRoute,
} from "@/lib/fleet/format";
import { loadOpportunities } from "@/lib/fleet/matches";
import { estimateHref, fleetRoutes } from "@/lib/fleet/routes";
import "./page.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

async function loadDashboard() {
  const [opportunities, company] = await Promise.all([
    loadOpportunities(),
    fetchCompany(),
  ]);
  return { opportunities, company };
}

function Dashboard() {
  const [today] = useState(() => dateFormat.format(new Date()));
  const request = useRequest(loadDashboard);

  const header = (
    <FleetHeader
      eyebrow="Fleet Manager Home"
      title="Welcome again"
      aside={
        <span className="fleet-pill">
          <CalendarIcon />
          {today}
        </span>
      }
    />
  );

  if (request.status !== "ready") {
    return (
      <>
        {header}
        <FleetRequestState
          request={request}
          loadingText="Loading overview…"
          unavailableTitle="Overview not available yet"
          unavailableText="Your freight opportunities and fleet summary will appear here once they are available."
        />
      </>
    );
  }

  const { opportunities, company } = request.data;
  const count = opportunities.length;
  const next = opportunities[0];
  const preview = opportunities.slice(0, 3);
  const matchedTrucks = new Set(opportunities.map((item) => item.truck_id))
    .size;
  const costSettingsReady = hasCostSettings(company);

  return (
    <>
      {header}

      <section className="dash-hero">
        <div className="dash-hero-main">
          <p className="dash-hero-eyebrow">Freight opportunities</p>
          <h2>
            {count
              ? "Opportunities ready to review"
              : "No opportunities to review"}
          </h2>
          <p className="dash-hero-count">
            <strong>{count}</strong>
            suitable {count === 1 ? "opportunity" : "opportunities"}
          </p>
          <Link href={fleetRoutes.opportunities} className="dash-hero-button">
            Review Opportunities
            <ArrowIcon size={14} />
          </Link>
        </div>

        <div className="dash-next">
          <p className="dash-next-label">Next route</p>
          {next ? (
            <>
              <div className="dash-next-route">
                <span>
                  <PinIcon size={18} />
                  {next.shipment.origin_address}
                </span>
                <ArrowIcon size={14} />
                <span>
                  <PinIcon size={18} />
                  {next.shipment.destination_address}
                </span>
              </div>
              <p className="dash-next-pickup">
                Next pickup · {formatPickup(next.shipment.pickup_time)}
              </p>
            </>
          ) : (
            <p className="dash-next-pickup">No upcoming pickup</p>
          )}
        </div>
      </section>

      <section className="dash-stats">
        <article>
          <h3>Opportunities to review</h3>
          <strong>{count}</strong>
          <p>Suitable for your fleet</p>
        </article>
        <article>
          <h3>Matched trucks</h3>
          <strong>{matchedTrucks}</strong>
          <p>Across open opportunities</p>
        </article>
        <article>
          <h3>Cost settings</h3>
          <strong>{costSettingsReady ? "Configured" : "Not set"}</strong>
          <p>
            {costSettingsReady
              ? "Ready for route assessment"
              : "Needed before running assessments"}
          </p>
        </article>
      </section>

      <section className="dash-list">
        <h2>Suitable freight opportunities</h2>

        {preview.length ? (
          <div className="dash-table" role="table">
            <div className="dash-row dash-row-head" role="row">
              <span role="columnheader">Route</span>
              <span role="columnheader">Cargo</span>
              <span role="columnheader">Pickup</span>
              <span role="columnheader">Required body</span>
              <span role="columnheader">Action</span>
            </div>
            {preview.map((item) => (
              <div className="dash-row" role="row" key={item.match_id}>
                <span role="cell" className="dash-route">
                  {formatRoute(item.shipment)}
                </span>
                <span role="cell" data-label="Cargo">
                  {item.shipment.cargo_type} ·{" "}
                  {formatKg(item.shipment.weight_kg)}
                </span>
                <span role="cell" data-label="Pickup">
                  {formatPickup(item.shipment.pickup_time)}
                </span>
                <span role="cell" data-label="Required body">
                  {formatLabel(item.shipment.required_body_type)}
                </span>
                <span role="cell">
                  <Link
                    href={estimateHref(item.match_id)}
                    className="dash-review"
                  >
                    Review
                  </Link>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="fleet-empty">
            <h2>You are all caught up</h2>
            <p>
              There are no available freight opportunities for your fleet right
              now.
            </p>
          </div>
        )}

        <Link href={fleetRoutes.opportunities} className="dash-view-all">
          View Opportunities
          <ArrowIcon size={14} />
        </Link>
      </section>
    </>
  );
}

export default function FleetDashboardPage() {
  return (
    <FleetPage active="overview">
      <Dashboard />
    </FleetPage>
  );
}
