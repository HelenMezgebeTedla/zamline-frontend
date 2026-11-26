"use client";

import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Ban,
  Banknote,
  Package,
  Pencil,
  Route,
  SearchX,
  StickyNote,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, DetailCard, DetailItem } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import StatusBadge from "@/components/ui/StatusBadge";
import { useResource } from "@/hooks/useResource";
import { toError } from "@/lib/http";
import { ACCEPTED_SHIPMENTS_PATH } from "@/lib/config";
import {
  cityOf,
  formatBodyType,
  formatDate,
  formatDateTime,
  formatMoney,
  formatWeight,
} from "@/lib/format";
import { cancelShipment, getShipment } from "@/lib/shipments";

const NOTICES = {
  created: {
    title: "Shipment posted",
    body: "Verified fleet managers with a matching truck can now see this shipment.",
  },
  updated: {
    title: "Changes saved",
    body: "Fleet managers will see the updated details.",
  },
};

export function BackLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 hover:text-brand-700"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {children}
    </Link>
  );
}

export function ShipmentDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}

export function ShipmentDetailsView() {
  const { shipmentId } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notice = NOTICES[searchParams.get("notice") ?? ""];

  const {
    data: shipment,
    error,
    isLoading,
    reload,
    setData,
  } = useResource(`shipment:${shipmentId}`, (signal) =>
    getShipment(shipmentId, signal),
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState();
  const [justCancelled, setJustCancelled] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(undefined);
    try {
      const updated = await cancelShipment(shipmentId);
      setData(updated);
      setJustCancelled(true);
      setConfirmOpen(false);
    } catch (caught) {
      const failure = toError(caught);
      if (failure.status === 409) reload();
      setCancelError(failure.message);
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading && !shipment) return <ShipmentDetailsSkeleton />;

  if (!shipment) {
    return (
      <div className="space-y-6">
        <BackLink href="/shipper/shipments">Back to current shipments</BackLink>
        <Card>
          {error?.status === 404 || error?.status === 422 ? (
            <EmptyState
              icon={SearchX}
              title="Shipment not found"
              description="It may have been removed, or it belongs to a different company."
              action={
                <ButtonLink href="/shipper/shipments" variant="secondary">
                  View your shipments
                </ButtonLink>
              }
            />
          ) : (
            <div className="p-6">
              <Alert
                tone="error"
                title="We couldn't load this shipment"
                action={
                  <Button variant="secondary" size="sm" onClick={reload}>
                    Try again
                  </Button>
                }
              >
                {error?.message}
              </Alert>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const isOpen = shipment.status === "open";

  return (
    <div className="space-y-8">
      <BackLink href="/shipper/shipments">Back to current shipments</BackLink>

      {notice ? (
        <Alert
          tone="success"
          title={notice.title}
          onDismiss={() => router.replace(pathname, { scroll: false })}
        >
          {notice.body}
        </Alert>
      ) : null}
      {justCancelled ? (
        <Alert
          tone="info"
          title="Shipment cancelled"
          onDismiss={() => setJustCancelled(false)}
        >
          Fleet managers can no longer see or accept this shipment.
        </Alert>
      ) : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
              {cityOf(shipment.origin_address)}
              <span aria-label="to" className="mx-2 text-slate-400">
                →
              </span>
              <span className="font-normal">
                {cityOf(shipment.destination_address)}
              </span>
            </h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Posted on {formatDate(shipment.published_at)}
          </p>
        </div>

        {isOpen ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => {
                setCancelError(undefined);
                setConfirmOpen(true);
              }}
            >
              <Ban aria-hidden className="size-4" />
              Cancel shipment
            </Button>
            <ButtonLink
              href={`/shipper/shipments/${shipment.shipment_id}/edit`}
            >
              <Pencil aria-hidden className="size-4" />
              Edit shipment
            </ButtonLink>
          </div>
        ) : null}
      </div>

      {shipment.status === "confirmed" ? (
        <Alert
          tone="success"
          title="A fleet company has accepted this shipment"
          action={
            <ButtonLink
              href={ACCEPTED_SHIPMENTS_PATH}
              variant="secondary"
              size="sm"
            >
              View accepted shipments
            </ButtonLink>
          }
        >
          Contact details for the fleet are on your Accepted Shipments page.
          Accepted shipments can&apos;t be edited.
        </Alert>
      ) : null}
      {shipment.status === "expired" ? (
        <Alert tone="warning" title="This shipment has expired">
          The pickup window passed before a fleet accepted it. Post a new
          shipment if you still need it moved.
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard icon={Route} title="Route and pickup">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="From" value={shipment.origin_address} />
            <DetailItem label="To" value={shipment.destination_address} />
            <DetailItem
              label="Pickup"
              value={formatDateTime(shipment.pickup_time)}
            />
          </dl>
        </DetailCard>

        <DetailCard icon={Package} title="Cargo">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Cargo type" value={shipment.cargo_type} />
            <DetailItem
              label="Weight"
              value={formatWeight(shipment.weight_kg)}
            />
            <DetailItem
              label="Truck body"
              value={formatBodyType(shipment.required_body_type)}
            />
          </dl>
        </DetailCard>

        <DetailCard icon={Banknote} title="Proposed payment">
          <p className="text-3xl font-semibold tracking-tight text-navy-950">
            {formatMoney(shipment.proposed_amount)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Amount you&apos;re offering for this trip.
          </p>
        </DetailCard>

        <DetailCard icon={StickyNote} title="Notes">
          {shipment.special_requirements ? (
            <p className="whitespace-pre-line text-sm text-navy-950">
              {shipment.special_requirements}
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              No handling or delivery notes were added.
            </p>
          )}
        </DetailCard>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this shipment?"
        description={
          <>
            {cityOf(shipment.origin_address)} →{" "}
            {cityOf(shipment.destination_address)} will be removed from Fleet
            Matching. This can&apos;t be undone.
          </>
        }
        confirmLabel="Cancel shipment"
        cancelLabel="Keep shipment"
        confirmVariant="dangerSolid"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
