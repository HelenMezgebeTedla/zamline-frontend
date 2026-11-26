import { AppShell } from "@/components/layout/AppShell";
import { ShipperGuard } from "@/components/layout/ShipperGuard";
import { instrumentSans } from "@/lib/fonts";

export function ShipperPage({ children }) {
  return (
    <div className={`${instrumentSans.variable} font-sans`}>
      <AppShell>
        <ShipperGuard>{children}</ShipperGuard>
      </AppShell>
    </div>
  );
}
