import { routeLabel, titleCase, toDateInputValue } from "./format.js";

export function counterpartyName(reservation, role) {
  if (!reservation) return "";
  return role === "fleet"
    ? reservation.shipper_company_name
    : reservation.fleet_company_name;
}

export function filterReservations(items, { query = "", date = "" } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (date && toDateInputValue(item.pickup_time) !== date) return false;
    if (!needle) return true;
    const haystack = [
      routeLabel(item.origin_address, item.destination_address),
      item.origin_address,
      item.destination_address,
      titleCase(item.cargo_type),
      item.fleet_company_name,
      item.shipper_company_name,
      item.plate_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function statusLabel(status) {
  if (status === "accepted") return "Active";
  if (status === "cancelled") return "Cancelled";
  if (status === "pending") return "Awaiting decision";
  return titleCase(status);
}

const ACCEPT_ERRORS = {
  "Load already claimed": {
    title: "Another fleet company booked this load first",
    message:
      "Only the first acceptance wins. Pick another opportunity from your list.",
  },
  "Shipment is no longer open": {
    title: "This shipment is no longer open",
    message:
      "The shipper has closed or cancelled it. Pick another opportunity from your list.",
  },
  "This truck is not available": {
    title: "This truck is not available",
    message:
      "Mark the truck as available in Fleet Setup, or choose an opportunity for another truck.",
  },
  "Your company is not verified yet": {
    title: "Your company is not verified yet",
    message:
      "You can accept loads once your PACRA certificate has been verified.",
  },
  "Only a fleet manager can do this": {
    title: "Only fleet managers can accept loads",
    message: "Sign in with a fleet manager account to book this load.",
  },
};

export function acceptErrorMessage(status, detail) {
  if (ACCEPT_ERRORS[detail]) return ACCEPT_ERRORS[detail];
  if (status === 409 && detail?.startsWith("This match was already")) {
    return {
      title: "You already responded to this opportunity",
      message: detail,
    };
  }
  if (status === 404) {
    return {
      title: "Opportunity not found",
      message: "It may have been removed. Go back to your opportunities list.",
    };
  }
  return {
    title: "We couldn't book this load",
    message: detail || "Something went wrong. Please try again.",
  };
}
