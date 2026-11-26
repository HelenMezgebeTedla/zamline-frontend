"use client";

import Link from "next/link";
import { CircleCheck, FileText, Package, Plus, Truck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/Feedback";
import { useResource } from "@/hooks/useResource";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { listShipments } from "@/lib/shipments";
import { ShipmentsTable } from "./ShipmentsTable";

const RECENT_LIMIT = 5;

export function ShipperDashboardView() {
  const user = useCurrentUser();
  const { data, error, isLoading, reload } = useResource(
    "shipments",
    listShipments,
  );

  const shipments = data ?? [];
  const openCount = shipments.filter(
    (shipment) => shipment.status === "open",
  ).length;
  const acceptedCount = shipments.filter(
    (shipment) => shipment.status === "confirmed",
  ).length;
  const recent = shipments.slice(0, RECENT_LIMIT);
  const greeting = user?.first_name
    ? `Welcome, ${user.first_name}`
    : "Welcome back";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Shipper overview"
        title={greeting}
        description="Keep track of the loads you have posted and the ones fleets have accepted."
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

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading && !data ? (
          <>
            <Skeleton className="h-[118px] rounded-2xl" />
            <Skeleton className="h-[118px] rounded-2xl" />
            <Skeleton className="h-[118px] rounded-2xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Active postings"
              value={openCount}
              icon={FileText}
              hint="Open and visible to fleets"
            />
            <StatCard
              label="Accepted shipments"
              value={acceptedCount}
              icon={CircleCheck}
              hint="Taken by a fleet company"
            />
            <StatCard
              label="Total posted"
              value={shipments.length}
              icon={Package}
              hint="All shipments you've posted"
            />
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <h2 className="text-base font-semibold text-navy-950">
            Recent shipments
          </h2>
          {shipments.length > 0 ? (
            <Link
              href="/shipper/shipments"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              View all
            </Link>
          ) : null}
        </div>

        {isLoading && !data ? (
          <div className="space-y-3 px-5 pb-6 sm:px-6">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : recent.length > 0 ? (
          <div className="border-t border-slate-100">
            <ShipmentsTable shipments={recent} compact />
          </div>
        ) : !error ? (
          <div className="border-t border-slate-100">
            <EmptyState
              icon={Truck}
              title="No shipments yet"
              description="Post your first shipment and verified fleet managers with a matching truck will be able to see it."
              action={
                <ButtonLink href="/shipper/shipments/new" variant="brand">
                  <Plus aria-hidden className="size-4" />
                  Post a shipment
                </ButtonLink>
              }
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
