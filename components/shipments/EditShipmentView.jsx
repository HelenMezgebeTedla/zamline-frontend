"use client";

import { useParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/Feedback";
import { useResource } from "@/hooks/useResource";
import { STATUS_LABELS } from "@/lib/constants";
import { cityOf } from "@/lib/format";
import { getShipment, updateShipment } from "@/lib/shipments";

import { BackLink } from "./ShipmentDetailsView";
import { ShipmentForm } from "./ShipmentForm";

export function EditShipmentSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-[560px] rounded-2xl" />
    </div>
  );
}

export function EditShipmentView() {
  const { shipmentId } = useParams();
  const router = useRouter();
  const detailsPath = `/shipper/shipments/${shipmentId}`;

  const {
    data: shipment,
    error,
    isLoading,
    reload,
  } = useResource(`shipment:${shipmentId}`, (signal) =>
    getShipment(shipmentId, signal),
  );

  async function handleSubmit(changes) {
    await updateShipment(shipmentId, changes);
    router.push(`${detailsPath}?notice=updated`);
  }

  if (isLoading && !shipment) return <EditShipmentSkeleton />;

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

  return (
    <div className="space-y-8">
      <BackLink href={detailsPath}>Back to shipment</BackLink>

      <PageHeader
        eyebrow="Edit shipment"
        title={`${cityOf(shipment.origin_address)} → ${cityOf(shipment.destination_address)}`}
        description="Only the details you change are updated. Changing an address updates its location on the map too."
      />

      {shipment.status === "open" ? (
        <Card className="p-6 sm:p-8 lg:p-10">
          <ShipmentForm
            mode="edit"
            shipment={shipment}
            onSubmit={handleSubmit}
            onCancel={() => router.push(detailsPath)}
          />
        </Card>
      ) : (
        <Alert
          tone="warning"
          title={`This shipment is ${STATUS_LABELS[shipment.status].toLowerCase()}`}
          action={
            <ButtonLink href={detailsPath} variant="secondary" size="sm">
              Back to shipment
            </ButtonLink>
          }
        >
          Only open shipments can be edited, so a fleet&apos;s commitment is
          never changed after they accept.
        </Alert>
      )}
    </div>
  );
}
