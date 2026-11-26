"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import FleetPage from "@/components/fleet/FleetPage";
import CancelBookingDialog from "@/components/reservations/CancelBookingDialog";
import ContactCard from "@/components/reservations/ContactCard";
import { ShipperPage } from "@/components/layout/ShipperPage";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { useLoad } from "@/hooks/useLoad";
import {
  formatDateTime,
  formatMoney,
  formatPickup,
  formatWeight,
  routeSentence,
  shortPlace,
  titleCase,
} from "@/lib/format";
import { RESERVATION_PAGES } from "@/lib/navigation";
import { counterpartyName } from "@/lib/reservationView";
import { cancelReservation, getReservation } from "@/lib/reservations";
import "@/components/ui/ui.css";
import "./reservations.css";

function InfoCard({ icon, title, children }) {
  return (
    <section className="zl-card res-info">
      <h2 className="res-info-title">
        <Icon name={icon} size={18} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pair({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading booking">
      <div className="zl-skeleton res-title-skeleton" />
      <div className="res-info-grid">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="zl-card res-info">
            <div className="zl-skeleton" />
            <div className="zl-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReservationDetailScreen({ role, reservationId }) {
  const page = RESERVATION_PAGES[role];
  const params = useSearchParams();
  const booking = useLoad(role, `reservation:${reservationId}`, () =>
    getReservation(reservationId),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancel, setCancel] = useState({ busy: false, error: "", done: false });
  const [contactVersion, setContactVersion] = useState(0);

  const reservation = booking.data;
  const cancelled = reservation?.status === "cancelled";
  const justBooked =
    params.get("booked") === "1" &&
    reservation?.status === "accepted" &&
    !cancel.done;

  async function confirmCancel(reason) {
    setCancel({ busy: true, error: "", done: false });
    try {
      const updated = await cancelReservation(reservationId, reason);
      booking.replace(updated);
      setCancel({ busy: false, error: "", done: true });
      setContactVersion((value) => value + 1);
      setDialogOpen(false);
    } catch (error) {
      setCancel({ busy: false, error: error.message, done: false });
    }
  }

  const content = (
    <>
      {role === "fleet" && (
        <nav className="fleet-breadcrumbs" aria-label="Breadcrumb">
          <Link href={page.listHref}>Booked loads</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Details</span>
        </nav>
      )}

      {role !== "fleet" && (
        <Link href={page.listHref} className="zl-link zl-back">
          <Icon name="arrowLeft" size={14} />
          {page.backLabel}
        </Link>
      )}

      {booking.loading && <DetailSkeleton />}

      {!booking.loading && !reservation && (
        <div className="zl-card zl-empty">
          <strong>
            {booking.error?.status === 404
              ? "Booking not found"
              : "We couldn't load this booking"}
          </strong>
          <span>
            {booking.error?.status === 404
              ? "It doesn't exist, or it belongs to another company."
              : booking.error?.message}
          </span>
          <Link href={page.listHref} className="zl-button res-empty-action">
            {page.backLabel}
          </Link>
        </div>
      )}

      {!booking.loading && reservation && (
        <>
          <header className="res-detail-head">
            <div>
              <h1 className="res-detail-title">
                {shortPlace(reservation.origin_address)}
                <span aria-hidden="true"> → </span>
                <span className="zl-visually-hidden"> to </span>
                {shortPlace(reservation.destination_address)}
              </h1>
              <p className="res-detail-subtitle">
                {role === "fleet"
                  ? `You booked this load for truck ${reservation.plate_number}.`
                  : `This shipment is accepted by ${reservation.fleet_company_name}.`}
              </p>
            </div>
            <StatusBadge status={reservation.status} />
          </header>

          {justBooked && (
            <div className="zl-alert is-success" role="status">
              <Icon name="shieldCheck" />
              <span>
                <strong>Load booked.</strong>
                The shipment is confirmed for your truck, and the shipper&apos;s
                contact details are now unlocked.
              </span>
            </div>
          )}
          {cancel.done && (
            <div className="zl-alert is-info" role="status">
              <Icon name="info" />
              <span>
                <strong>Booking cancelled.</strong>
                The shipment has been cancelled and contact details are hidden
                again.
              </span>
            </div>
          )}

          <div className="res-info-grid">
            <InfoCard icon="route" title="Route and pickup">
              <dl className="res-pairs">
                <Pair label="Route">
                  {routeSentence(
                    reservation.origin_address,
                    reservation.destination_address,
                  )}
                </Pair>
                <Pair label="Pickup">
                  {formatPickup(reservation.pickup_time)}
                </Pair>
              </dl>
            </InfoCard>
            <InfoCard icon="package" title="Cargo">
              <p className="res-info-main">
                {titleCase(reservation.cargo_type)}
              </p>
              <p className="res-info-sub">
                {formatWeight(reservation.weight_kg)}
              </p>
            </InfoCard>
            <InfoCard icon="banknote" title="Agreed price">
              <p className="res-info-price">
                {formatMoney(reservation.proposed_amount)}
              </p>
            </InfoCard>
            <InfoCard
              icon={role === "fleet" ? "building" : "truck"}
              title={role === "fleet" ? "Shipper" : "Matched fleet company"}
            >
              <p className="res-info-main">
                {counterpartyName(reservation, role) || "—"}
              </p>
              <p className="res-info-sub">
                {role === "fleet"
                  ? `Your truck: ${reservation.plate_number}`
                  : `Truck ${reservation.plate_number}`}
              </p>
            </InfoCard>
          </div>

          <div className="res-detail-bottom">
            <ContactCard
              role={role}
              shipmentId={reservation.shipment_id}
              version={contactVersion}
              cancelled={cancelled}
            />

            <section className="zl-card res-booking-meta">
              <h2 className="zl-card-title">Booking</h2>
              <dl className="res-pairs">
                <Pair label="Booked on">
                  {formatDateTime(reservation.reserved_at)}
                </Pair>
                <Pair label="Reference">
                  <code className="res-ref">
                    {reservation.reservation_id.slice(0, 8).toUpperCase()}
                  </code>
                </Pair>
                <Pair label="Shipment status">
                  {titleCase(reservation.shipment_status)}
                </Pair>
              </dl>
              {!cancelled && (
                <>
                  <p className="res-muted res-cancel-note">
                    Plans changed? Cancelling releases the shipment and hides
                    both companies&apos; contact details again.
                  </p>
                  <button
                    type="button"
                    className="zl-button is-danger-outline"
                    onClick={() => setDialogOpen(true)}
                  >
                    Cancel booking
                  </button>
                </>
              )}
            </section>
          </div>

          <CancelBookingDialog
            open={dialogOpen}
            busy={cancel.busy}
            error={cancel.error}
            onConfirm={confirmCancel}
            onClose={() => setDialogOpen(false)}
          />
        </>
      )}
    </>
  );

  if (role === "fleet") {
    return <FleetPage active="booked-loads">{content}</FleetPage>;
  }

  return <ShipperPage>{content}</ShipperPage>;
}
