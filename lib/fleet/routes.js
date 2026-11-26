export const fleetRoutes = {
  login: "/fleet/login",
  dashboard: "/fleet/dashboard",
  opportunities: "/fleet/opportunities",
  bookedLoads: "/fleet/booked-loads",
  profile: "/fleet/profile",
  costEstimation: "/fleet/cost-estimation",
  fleetSetup: "/fleet/fleet-setup",
  costSettings: "/fleet/cost-settings",
};

export function estimateHref(matchId) {
  return `${fleetRoutes.costEstimation}?matchId=${encodeURIComponent(matchId)}`;
}
