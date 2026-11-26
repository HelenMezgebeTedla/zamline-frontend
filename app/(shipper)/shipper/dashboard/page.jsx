import { ShipperPage } from "@/components/layout/ShipperPage";
import { ShipperDashboardView } from "@/components/shipments/ShipperDashboardView";

export const metadata = { title: "Dashboard · ZamLine" };

export default function DashboardPage() {
  return (
    <ShipperPage>
      <ShipperDashboardView />
    </ShipperPage>
  );
}
