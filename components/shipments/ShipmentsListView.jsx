"use client";

import { useState } from "react";
import { Inbox, Plus, Truck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, SearchInput, Select } from "@/components/ui/Field";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/Feedback";
import { useResource } from "@/hooks/useResource";
import { STATUS_LABELS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { listShipments } from "@/lib/shipments";

import { ShipmentsTable } from "./ShipmentsTable";

function matchesSearch(shipment, search) {
  if (!search) return true;
  const haystack = [
    shipment.origin_address,
    shipment.destination_address,
    shipment.cargo_type,
    shipment.special_requirements ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function ShipmentsListView() {
  const { data, error, isLoading, reload } = useResource(
    "shipments",
    listShipments,
  );
  const [search, setSearch] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [status, setStatus] = useState("all");

  const shipments = data ?? [];
  const filtered = shipments.filter(
    (shipment) =>
      matchesSearch(shipment, search.trim()) &&
      (!pickupDate || toDateInput(shipment.pickup_time) === pickupDate) &&
      (status === "all" || shipment.status === status),
  );
  const hasFilters =
    search.trim() !== "" || pickupDate !== "" || status !== "all";

  function clearFilters() {
    setSearch("");
    setPickupDate("");
    setStatus("all");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Current shipments"
        title="Your shipments"
        description="Every shipment your company has posted, newest first."
        actions={
          <ButtonLink href="/shipper/shipments/new" variant="brand">
            <Plus aria-hidden className="size-4" />
            Post new shipment
          </ButtonLink>
        }
      />

      {error ? (
        <Alert
          tone="error"
          title="We couldn't load your shipments"
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Try again
            </Button>
          }
        >
          {error.message}
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-navy-950">
              All shipments
            </h2>
            {data ? (
              <p className="text-sm text-slate-500" aria-live="polite">
                {hasFilters
                  ? `${filtered.length} of ${shipments.length}`
                  : shipments.length}{" "}
                {shipments.length === 1 ? "shipment" : "shipments"}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <SearchInput
              aria-label="Search by route or cargo"
              placeholder="Search route or cargo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Input
              type="date"
              aria-label="Pickup date"
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
            />
            <Select
              aria-label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              {Object.keys(STATUS_LABELS).map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100">
          {isLoading && !data ? (
            <div className="space-y-3 p-5 sm:p-6">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <ShipmentsTable shipments={filtered} />
          ) : shipments.length > 0 ? (
            <EmptyState
              icon={Inbox}
              title="No shipments match your filters"
              description="Try a different search, date or status."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : !error ? (
            <EmptyState
              icon={Truck}
              title="You haven't posted any shipments"
              description="Shipments you post will appear here so you can track and manage them."
              action={
                <ButtonLink href="/shipper/shipments/new" variant="brand">
                  <Plus aria-hidden className="size-4" />
                  Post a shipment
                </ButtonLink>
              }
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
