"use client";

import Link from "next/link";
import { useState } from "react";
import FleetPage, { FleetHeader } from "@/components/fleet/FleetPage";
import { ShipperPage } from "@/components/layout/ShipperPage";
import { PageHeader } from "@/components/ui/Feedback";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { useLoad } from "@/hooks/useLoad";
import {
  formatDateTime,
  formatMoney,
  formatWeight,
  routeLabel,
  TIME_ZONE_LABEL,
  titleCase,
} from "@/lib/format";
import { RESERVATION_PAGES } from "@/lib/navigation";
import { counterpartyName, filterReservations } from "@/lib/reservationView";
import { STATUS_FILTERS, listReservations } from "@/lib/reservations";
import "@/components/ui/ui.css";
import "./reservations.css";

function LoadingRows() {
  return (
    <div className="res-rows" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((row) => (
        <div key={row} className="res-row is-loading">
          <div className="zl-skeleton" />
        </div>
      ))}
    </div>
  );
}

export default function ReservationsScreen({ role }) {
  const page = RESERVATION_PAGES[role];
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const list = useLoad(role, `reservations:${status}`, () =>
    listReservations(status),
  );

  const items = list.data || [];
  const visible = filterReservations(items, { query, date });
  const filtering = Boolean(query || date);

  const content = (
    <>
      {role === "fleet" ? (
        <FleetHeader
          eyebrow={page.eyebrow}
          title={page.title}
          aside={
            <span className="fleet-pill is-round">
              {list.loading ? "Loading…" : page.countLabel(visible.length)}
            </span>
          }
        />
      ) : (
        <div className="mb-8">
          <PageHeader eyebrow={page.eyebrow} title={page.title} />
        </div>
      )}

      <section className="zl-card res-card" aria-labelledby="res-card-title">
        <div className="res-card-head">
          <h2 id="res-card-title" className="zl-card-title">
            {page.cardTitle}
          </h2>
          <div className="res-card-meta">
            <span className="res-count" aria-live="polite">
              {list.loading ? "Loading…" : page.countLabel(visible.length)}
            </span>
            <label className="zl-visually-hidden" htmlFor="res-status">
              Status
            </label>
            <select
              id="res-status"
              className="zl-select res-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="res-toolbar">
          <label className="zl-field-icon res-search">
            <Icon name="search" size={16} />
            <span className="zl-visually-hidden">Search</span>
            <input
              type="search"
              className="zl-input"
              placeholder={page.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="zl-field-icon res-date">
            <Icon name="calendar" size={16} />
            <span className="zl-visually-hidden">
              Pickup date, Zambia time ({TIME_ZONE_LABEL})
            </span>
            <input
              type="date"
              className="zl-input"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          {filtering && (
            <button
              type="button"
              className="zl-link res-clear"
              onClick={() => {
                setQuery("");
                setDate("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {!list.loading && list.error && (
          <div className="zl-alert is-error" role="alert">
            <Icon name="alert" />
            <span>
              <strong>We couldn&apos;t load your bookings</strong>
              {list.error.message}
            </span>
          </div>
        )}

        <div className="res-table" role="table" aria-label={page.cardTitle}>
          <div className="res-head" role="row">
            <span role="columnheader">Route</span>
            <span role="columnheader">Cargo / details</span>
            <span role="columnheader">{page.counterpartyColumn}</span>
            <span role="columnheader">Agreed price</span>
            <span role="columnheader">Pickup ({TIME_ZONE_LABEL})</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">
              <span className="zl-visually-hidden">Details</span>
            </span>
          </div>

          {list.loading && <LoadingRows />}

          {!list.loading && visible.length > 0 && (
            <div className="res-rows" role="rowgroup">
              {visible.map((item) => {
                const href = `${page.listHref}/${item.reservation_id}`;
                const route = routeLabel(
                  item.origin_address,
                  item.destination_address,
                );
                return (
                  <div key={item.reservation_id} className="res-row" role="row">
                    <span role="cell" className="res-route" data-label="Route">
                      {route}
                    </span>
                    <span role="cell" data-label="Cargo">
                      <span className="res-cell">
                        <strong>{titleCase(item.cargo_type)}</strong>
                        <small>{formatWeight(item.weight_kg)}</small>
                      </span>
                    </span>
                    <span role="cell" data-label={page.counterpartyColumn}>
                      <span className="res-cell">
                        {counterpartyName(item, role) || "—"}
                        {role === "fleet" && <small>{item.plate_number}</small>}
                      </span>
                    </span>
                    <span
                      role="cell"
                      className="res-price"
                      data-label="Agreed price"
                    >
                      {formatMoney(item.proposed_amount)}
                    </span>
                    <span role="cell" data-label="Pickup">
                      {formatDateTime(item.pickup_time)}
                    </span>
                    <span role="cell" data-label="Status">
                      <StatusBadge status={item.status} />
                    </span>
                    <span role="cell" className="res-action">
                      <Link href={href} className="zl-link">
                        View details
                        <span className="zl-visually-hidden"> for {route}</span>
                      </Link>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!list.loading && !list.error && visible.length === 0 && (
          <div className="zl-empty">
            <strong>
              {filtering || status
                ? "Nothing matches these filters"
                : page.emptyTitle}
            </strong>
            <span>
              {filtering || status
                ? "Try a different search or date."
                : page.emptyText}
            </span>
            {!filtering && !status && page.emptyAction && (
              <Link
                href={page.emptyAction.href}
                className="zl-button res-empty-action"
              >
                {page.emptyAction.label}
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );

  if (role === "fleet") {
    return <FleetPage active="booked-loads">{content}</FleetPage>;
  }

  return <ShipperPage>{content}</ShipperPage>;
}
