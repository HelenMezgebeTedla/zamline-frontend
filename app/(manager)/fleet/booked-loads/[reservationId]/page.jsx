"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import ReservationDetailScreen from "@/components/reservations/ReservationDetailScreen";

export default function FleetBookedLoadPage() {
  const { reservationId } = useParams();
  return (
    <Suspense>
      <ReservationDetailScreen role="fleet" reservationId={reservationId} />
    </Suspense>
  );
}
