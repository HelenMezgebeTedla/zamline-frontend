const numberFormat = new Intl.NumberFormat("en-US");
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatZmw(value) {
  return `ZMW ${numberFormat.format(Math.round(Number(value)))}`;
}

export function formatKg(value) {
  return `${numberFormat.format(Number(value))} kg`;
}

export function formatKm(value) {
  return `${numberFormat.format(Math.round(Number(value)))} km`;
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatPickup(value) {
  return dateTimeFormat.format(new Date(value)).replace(",", " ·");
}

export function formatLabel(value) {
  if (!value) return "";
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatRoute(shipment) {
  return `${shipment.origin_address} → ${shipment.destination_address}`;
}
