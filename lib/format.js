export const TIME_ZONE = "Africa/Lusaka";
export const TIME_ZONE_LABEL = "CAT";

const moneyFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});

const weightFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 1,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

const isoDayFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function zambiaParts(date) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return `ZMW ${moneyFormat.format(value)}`;
}

export function formatWeight(kg) {
  if (kg === null || kg === undefined || kg === "") return "—";
  const value = Number(kg);
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${weightFormat.format(value)} kg`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

export function formatTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : `${timeFormat.format(date)} ${TIME_ZONE_LABEL}`;
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const dateStr = formatDate(iso);
  const timeStr = formatTime(iso);
  if (dateStr === "—" || timeStr === "—") return "—";
  return `${dateStr} · ${timeStr}`;
}

export function formatPickup(value) {
  if (!value) return "—";
  const dateStr = formatDate(value);
  const timeStr = formatTime(value);
  if (dateStr === "—" || timeStr === "—") return "—";
  return `${dateStr} at ${timeStr}`;
}

export function toDateInputValue(value) {
  const date = toDate(value);
  if (!date) return "";
  return isoDayFormatter.format(date);
}

export function toDateInput(iso) {
  if (!iso) return "";
  return zambiaParts(new Date(iso)).date;
}

export function toTimeInput(iso) {
  if (!iso) return "";
  return zambiaParts(new Date(iso)).time;
}

export function isFuturePickup(date, time) {
  if (!date || !time) return false;
  const now = zambiaParts(new Date());
  return `${date}T${time}` > `${now.date}T${now.time}`;
}

export function shortPlace(address) {
  if (!address) return "—";
  return address.split(",")[0]?.trim() || "—";
}

export function cityOf(address) {
  if (!address) return "—";
  return address.split(",")[0]?.trim() || address;
}

export function routeLabel(origin, destination) {
  return `${shortPlace(origin)} → ${shortPlace(destination)}`;
}

export function routeSentence(origin, destination) {
  return `${shortPlace(origin)} to ${shortPlace(destination)}`;
}

export function titleCase(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatBodyType(bodyType) {
  if (!bodyType) return "";
  return bodyType.charAt(0).toUpperCase() + bodyType.slice(1);
}

export function initials(firstOrName, last) {
  if (last !== undefined) {
    const value = `${firstOrName?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
    return value || "?";
  }
  const parts = String(firstOrName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const firstChar = parts[0][0];
  const lastChar = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${firstChar}${lastChar}`.toUpperCase();
}

export function fullName(user) {
  if (!user) return "";
  return [user.first_name, user.last_name].filter(Boolean).join(" ");
}
