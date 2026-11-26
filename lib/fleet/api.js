import { api, ApiError, session } from "../api";
import { clearSession } from "../session";

export { API_URL, ApiError } from "../api";
export { clearSession as clearToken };

const authed = (options = {}) => ({ auth: true, ...options });

export function listTrucks() {
  return api("/trucks", authed());
}

export function listAllocations() {
  return api("/trucks/allocations", authed());
}

export function getTruck(truckId) {
  return api(`/trucks/${truckId}`, authed());
}

export function getTruckAllocation(truckId) {
  return api(`/trucks/${truckId}/allocation`, authed());
}

export function createTruck(payload) {
  return api("/trucks", authed({ method: "POST", body: payload }));
}

export function updateTruck(truckId, changes) {
  return api(`/trucks/${truckId}`, authed({ method: "PATCH", body: changes }));
}

export function updateAvailability(truckId, availabilityStatus) {
  return api(
    `/trucks/${truckId}/availability`,
    authed({
      method: "PATCH",
      body: { availability_status: availabilityStatus },
    }),
  );
}

export function retireTruck(truckId, reason) {
  return api(
    `/trucks/${truckId}/retire`,
    authed({ method: "POST", body: reason ? { reason } : {} }),
  );
}

function costSettingsPath() {
  const companyId = session.getCompanyId();
  if (!companyId) throw new ApiError(401, "Please log in again.");
  return `/companies/${encodeURIComponent(companyId)}/cost-settings`;
}

export async function getCostSettings() {
  return api(costSettingsPath(), authed());
}

export async function updateCostSettings(changes, confirmExtreme = false) {
  const body = { ...changes };
  if (confirmExtreme) body.confirm_extreme_values = true;
  return api(costSettingsPath(), authed({ method: "PATCH", body }));
}
