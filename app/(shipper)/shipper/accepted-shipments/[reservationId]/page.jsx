"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import ReservationDetailScreen from "@/components/reservations/ReservationDetailScreen";

export default function ShipperAcceptedShipmentPage() {
  const { reservationId } = useParams();
  return (
    <Suspense>
      <ReservationDetailScreen role="shipper" reservationId={reservationId} />
    </Suspense>
  );
}
