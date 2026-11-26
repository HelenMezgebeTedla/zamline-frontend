import { ShipperPage } from "@/components/layout/ShipperPage";
import { ShipmentsListView } from "@/components/shipments/ShipmentsListView";

export const metadata = { title: "Current shipments · ZamLine" };

export default function ShipmentsPage() {
  return (
    <ShipperPage>
      <ShipmentsListView />
    </ShipperPage>
  );
}
