"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Feedback";
import { createShipment } from "@/lib/shipments";

import { ShipmentForm } from "./ShipmentForm";

export function PostShipmentView() {
  const router = useRouter();

  async function handleSubmit(payload) {
    const shipment = await createShipment(payload);
    router.push(`/shipper/shipments/${shipment.shipment_id}?notice=created`);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="New shipment"
        title="Post a shipment opportunity"
        description="Tell fleet managers what needs to move. Verified fleets with a matching truck will see it straight away."
      />
      <Card className="p-6 sm:p-8 lg:p-10">
        <ShipmentForm mode="create" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
