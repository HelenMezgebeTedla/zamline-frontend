"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FleetPage, {
  FleetHeader,
  FleetRequestState,
} from "@/components/fleet/FleetPage";
import { RouteIcon, SearchIcon } from "@/components/fleet/icons";
import { useRequest } from "@/hooks/useRequest";
import {
  formatKg,
  formatLabel,
  formatPickup,
  formatZmw,
} from "@/lib/fleet/format";
import { loadOpportunities } from "@/lib/fleet/matches";
import { estimateHref, fleetRoutes } from "@/lib/fleet/routes";
import "./page.css";

const WEIGHT_RANGES = [
  { value: "light", label: "Under 15,000 kg", test: (kg) => kg < 15000 },
  {
    value: "medium",
    label: "15,000 – 25,000 kg",
    test: (kg) => kg >= 15000 && kg <= 25000,
  },
  { value: "heavy", label: "Over 25,000 kg", test: (kg) => kg > 25000 },
];

const FILTERS = [
  {
    key: "truckType",
    label: "Truck type",
    read: (item) => item.truck.truck_type,
  },
  {
    key: "destination",
    label: "Destination",
    read: (item) => item.shipment.destination_address,
  },
  {
    key: "cargoType",
    label: "Cargo type",
    read: (item) => item.shipment.cargo_type,
  },
  {
    key: "bodyType",
    label: "Body type",
    read: (item) => item.shipment.required_body_type,
    optionLabel: formatLabel,
  },
  {
    key: "weight",
    label: "Weight range",
    options: WEIGHT_RANGES.map((range) => range.value),
    optionLabel: (value) =>
      WEIGHT_RANGES.find((range) => range.value === value).label,
    match: (item, value) =>
      WEIGHT_RANGES.find((range) => range.value === value).test(
        Number(item.shipment.weight_kg),
      ),
  },
];

const EMPTY_FILTERS = Object.fromEntries(FILTERS.map((f) => [f.key, ""]));

function filterOptions(filter, items) {
  if (filter.options) return filter.options;
  return [...new Set(items.map(filter.read))].sort();
}

function filterMatches(filter, item, value) {
  if (!value) return true;
  return filter.match ? filter.match(item, value) : filter.read(item) === value;
}

function matchesSearch(item, query) {
  if (!query) return true;
  const { shipment, truck } = item;
  const text = [
    shipment.cargo_type,
    shipment.origin_address,
    shipment.destination_address,
    shipment.required_body_type,
    truck.truck_type,
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

function countLabel(n) {
  return `${n} ${n === 1 ? "opportunity" : "opportunities"}`;
}

function OpportunityCard({ item }) {
  const { shipment, truck } = item;
  return (
    <article className="opps-card">
      <div className="opps-card-body">
        <h3>
          {shipment.cargo_type} · {shipment.origin_address} to{" "}
          {shipment.destination_address}
        </h3>
        <p className="opps-card-route">
          <span>{shipment.origin_address}</span>
          <RouteIcon size={15} />
          <span>{shipment.destination_address}</span>
        </p>

        <dl className="opps-card-facts">
          <div>
            <dt>Body type</dt>
            <dd>{formatLabel(shipment.required_body_type)}</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{formatKg(shipment.weight_kg)}</dd>
          </div>
          <div>
            <dt>Matched truck</dt>
            <dd>{truck.truck_type}</dd>
          </div>
          <div>
            <dt>Pickup</dt>
            <dd>{formatPickup(shipment.pickup_time)}</dd>
          </div>
        </dl>
      </div>

      <div className="opps-card-side">
        <div>
          <span className="opps-card-pay-label">Proposed payment</span>
          <strong className="opps-card-pay">
            {formatZmw(shipment.proposed_amount)}
          </strong>
        </div>
        <Link href={estimateHref(item.match_id)} className="opps-card-button">
          View details
        </Link>
      </div>
    </article>
  );
}

function Opportunities() {
  const request = useRequest(loadOpportunities);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const available = request.data;

  const results = useMemo(() => {
    if (!available) return [];
    return available.filter(
      (item) =>
        matchesSearch(item, query.trim()) &&
        FILTERS.every((filter) =>
          filterMatches(filter, item, filters[filter.key]),
        ),
    );
  }, [available, query, filters]);

  const header = (total) => (
    <FleetHeader
      eyebrow="Fleet Manager"
      title="Freight Opportunities"
      subtitle="Review shipments matched to your fleet setup and business criteria."
      aside={
        total === null ? null : (
          <span className="fleet-pill is-round">{countLabel(total)}</span>
        )
      }
    />
  );

  if (request.status !== "ready") {
    return (
      <>
        {header(null)}
        <FleetRequestState
          request={request}
          loadingText="Loading opportunities…"
          unavailableTitle="Opportunities not available yet"
          unavailableText="Freight opportunities matched to your fleet will appear here once they are available."
        />
      </>
    );
  }

  const filtering = query.trim() !== "" || FILTERS.some((f) => filters[f.key]);
  const total = available.length;

  function clearFilters() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  }

  return (
    <>
      {header(total)}

      <section className="opps-filters" aria-label="Search and filter">
        <label className="opps-search">
          <SearchIcon size={15} />
          <input
            type="search"
            placeholder="Search routes, cargo or destinations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search opportunities"
          />
        </label>

        <div className="opps-filter-row">
          <button
            type="button"
            className={`opps-all ${filtering ? "" : "is-active"}`}
            onClick={clearFilters}
            aria-pressed={!filtering}
          >
            All
          </button>

          {FILTERS.map((filter) => (
            <select
              key={filter.key}
              className={filters[filter.key] ? "is-set" : undefined}
              value={filters[filter.key]}
              onChange={(event) =>
                setFilters({ ...filters, [filter.key]: event.target.value })
              }
              aria-label={filter.label}
            >
              <option value="">{filter.label}</option>
              {filterOptions(filter, available).map((option) => (
                <option key={option} value={option}>
                  {filter.optionLabel ? filter.optionLabel(option) : option}
                </option>
              ))}
            </select>
          ))}
        </div>
      </section>

      <section className="opps-list">
        <div className="opps-list-head">
          <h2>Available freight</h2>
          <span>
            {filtering
              ? `${results.length} of ${countLabel(total)}`
              : countLabel(total)}
          </span>
        </div>

        {results.map((item) => (
          <OpportunityCard key={item.match_id} item={item} />
        ))}

        {results.length === 0 && total > 0 && (
          <div className="fleet-empty">
            <h2>No opportunities match your filters</h2>
            <p>Try a different search or clear the filters to see all.</p>
            <button
              type="button"
              className="fleet-button is-outline"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {total === 0 && (
          <div className="fleet-empty">
            <h2>No available opportunities</h2>
            <p>
              There are no open shipments matched to your fleet right now. New
              matches will appear here.
            </p>
            <Link href={fleetRoutes.dashboard} className="fleet-button">
              Back to overview
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

export default function FleetOpportunitiesPage() {
  return (
    <FleetPage active="opportunities">
      <Opportunities />
    </FleetPage>
  );
}
