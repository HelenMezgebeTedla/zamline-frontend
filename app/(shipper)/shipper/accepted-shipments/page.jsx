import ReservationsScreen from "@/components/reservations/ReservationsScreen";

export const metadata = { title: "Accepted shipments · ZamLine" };

export default function ShipperAcceptedShipmentsPage() {
  return <ReservationsScreen role="shipper" />;
}
