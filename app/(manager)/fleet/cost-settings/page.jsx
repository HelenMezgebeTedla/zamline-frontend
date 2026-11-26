import FleetPage from "@/components/fleet/FleetPage";
import CostSettings from "@/components/fleet/CostSettings";
import "@/components/fleet/FleetTools.css";

export const metadata = { title: "Cost Settings | ZamLine" };

export default function CostSettingsPage() {
  return (
    <FleetPage active="cost-settings">
      <div className="fleet-tools">
        <CostSettings />
      </div>
    </FleetPage>
  );
}
