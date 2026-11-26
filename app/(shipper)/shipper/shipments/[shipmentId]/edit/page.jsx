import { Suspense } from "react";
import { ShipperPage } from "@/components/layout/ShipperPage";
import {
  EditShipmentSkeleton,
  EditShipmentView,
} from "@/components/shipments/EditShipmentView";

export const metadata = { title: "Edit shipment · ZamLine" };

export default function EditShipmentPage() {
  return (
    <ShipperPage>
      <Suspense fallback={<EditShipmentSkeleton />}>
        <EditShipmentView />
      </Suspense>
    </ShipperPage>
  );
}
