import { api, ApiError, session } from "@/lib/api";

const companyRequests = new Map();

function notLoggedIn() {
  return Promise.reject(new ApiError(401, "Not logged in."));
}

export function fetchCompany() {
  const companyId = session.getCompanyId();
  if (!companyId) return notLoggedIn();
  if (!companyRequests.has(companyId)) {
    const request = api(`/companies/${companyId}`, { auth: true }).catch(
      (error) => {
        companyRequests.delete(companyId);
        throw error;
      },
    );
    companyRequests.set(companyId, request);
  }
  return companyRequests.get(companyId);
}

export function hasCostSettings(company) {
  return Boolean(
    company?.fuel_price_per_litre && company?.driver_daily_allowance,
  );
}

export function endFleetSession() {
  session.setToken(null);
  session.setCompanyId(null);
  session.setRole(null);
  session.setVerified(null);
  session.setEmail(null);
  companyRequests.clear();
}
