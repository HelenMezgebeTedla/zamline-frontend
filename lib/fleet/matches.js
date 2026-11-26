import { api, ApiError, session } from "@/lib/api";

function currentUserId() {
  const token = session.getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).sub || null;
  } catch {
    return null;
  }
}

function actorQuery() {
  const userId = currentUserId();
  if (!userId) throw new ApiError(401, "Not logged in.");
  return `actor_user_id=${encodeURIComponent(userId)}`;
}

function byPickupTime(a, b) {
  return new Date(a.shipment.pickup_time) - new Date(b.shipment.pickup_time);
}

export async function loadOpportunities() {
  const matches = await api(`/shipment-matches/generate?${actorQuery()}`, {
    method: "POST",
    auth: true,
  });
  return [...matches].sort(byPickupTime);
}

function matchPath(matchId, action = "") {
  return `/shipment-matches/${encodeURIComponent(matchId)}${action}?${actorQuery()}`;
}

export function loadMatch(matchId) {
  return api(matchPath(matchId), { auth: true });
}

export function runAssessment(matchId) {
  return api(matchPath(matchId, "/assessment"), { method: "POST", auth: true });
}

export function acceptMatch(matchId) {
  return api(matchPath(matchId, "/accept"), { method: "POST", auth: true });
}

export function skipMatch(matchId) {
  return api(matchPath(matchId, "/skip"), { method: "POST", auth: true });
}

async function geocode(address) {
  const text = /zambia/i.test(address) ? address : `${address}, Zambia`;
  const places = await api(
    `/shipment-matches/geocode?${actorQuery()}&size=1&text=${encodeURIComponent(text)}`,
    { auth: true },
  );
  if (!places.length) {
    throw new ApiError(404, `Could not find "${address}" on the map.`);
  }
  return places[0];
}

export async function loadRoute(shipment) {
  const [origin, destination] = await Promise.all([
    geocode(shipment.origin_address),
    geocode(shipment.destination_address),
  ]);
  const query = new URLSearchParams({
    origin_latitude: origin.latitude,
    origin_longitude: origin.longitude,
    destination_latitude: destination.latitude,
    destination_longitude: destination.longitude,
  });
  const route = await api(`/shipment-matches/route?${actorQuery()}&${query}`, {
    auth: true,
  });
  return { ...route, origin, destination };
}
