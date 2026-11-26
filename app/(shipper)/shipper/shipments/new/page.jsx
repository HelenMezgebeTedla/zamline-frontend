import { ShipperPage } from "@/components/layout/ShipperPage";
import { PostShipmentView } from "@/components/shipments/PostShipmentView";

export const metadata = { title: "Post a shipment · ZamLine" };

export default function PostShipmentPage() {
  return (
    <ShipperPage>
      <PostShipmentView />
    </ShipperPage>
  );
}
