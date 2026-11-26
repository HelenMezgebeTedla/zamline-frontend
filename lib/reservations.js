import { api } from "@/lib/api";

export const STATUS_FILTERS = [
  { value: "", label: "View all" },
  { value: "accepted", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
];

export const CANCEL_REASON_LIMIT = 500;

export function reservationsPath(status) {
  return status
    ? `/reservations?status=${encodeURIComponent(status)}`
    : "/reservations";
}

export function listReservations(status) {
  return api(reservationsPath(status), { auth: true });
}

export function getReservation(reservationId) {
  return api(`/reservations/${encodeURIComponent(reservationId)}`, {
    auth: true,
  });
}

export function cancelReservation(reservationId, reason) {
  const trimmed = reason?.trim();
  return api(`/reservations/${encodeURIComponent(reservationId)}/cancel`, {
    method: "PATCH",
    body: trimmed ? { reason: trimmed } : {},
    auth: true,
  });
}

export function acceptMatch(matchId) {
  return api("/reservations", { body: { match_id: matchId }, auth: true });
}

export function getContact(shipmentId) {
  return api(`/shipments/${encodeURIComponent(shipmentId)}/contact`, {
    auth: true,
  });
}
