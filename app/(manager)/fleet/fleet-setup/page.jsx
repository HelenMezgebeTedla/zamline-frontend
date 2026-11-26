import FleetPage from "@/components/fleet/FleetPage";
import FleetSetup from "@/components/fleet/FleetSetup";
import "@/components/fleet/FleetTools.css";

export const metadata = { title: "Fleet Setup | ZamLine" };

export default function FleetSetupPage() {
  return (
    <FleetPage active="fleet-setup">
      <div className="fleet-tools">
        <FleetSetup />
      </div>
    </FleetPage>
  );
}
