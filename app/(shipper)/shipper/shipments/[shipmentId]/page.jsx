import { Suspense } from "react";
import { ShipperPage } from "@/components/layout/ShipperPage";
import {
  ShipmentDetailsSkeleton,
  ShipmentDetailsView,
} from "@/components/shipments/ShipmentDetailsView";

export const metadata = { title: "Shipment details · ZamLine" };

export default function ShipmentDetailsPage() {
  return (
    <ShipperPage>
      <Suspense fallback={<ShipmentDetailsSkeleton />}>
        <ShipmentDetailsView />
      </Suspense>
    </ShipperPage>
  );
}
