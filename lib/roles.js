import { images } from "@/lib/images";

export const ROLES = {
  shipper: {
    key: "shipper",
    label: "Shipper",
    basePath: "/shipper",
    images: {
      login: images.shipperLogin,
      signup: images.shipperSignup,
      verify: images.shipperVerify,
      welcome: images.shipperWelcome,
    },
    signup: {
      captionLabel: "Shipper",
      captionTitle: "Build your Shipper account.",
      eyebrow: "Shipper account",
      title: "Create your Shipper Account",
    },
    welcome: {
      verifiedBadge: "Verified Business",
      verifiedMessage:
        "Business is verified and ready to post shipment opportunities with trusted transport companies.",
      pendingMessage:
        "Your business is not verified yet. Upload your PACRA certificate below to verify your business and start posting shipments.",
      primaryLabel: "Create Shipment",
      primaryPath: "/shipper/shipments/new",
      dashboardPath: "/shipper/dashboard",
    },
  },
  fleet: {
    key: "fleet",
    label: "Fleet Manager",
    basePath: "/fleet",
    images: {
      login: images.fleetLogin,
      signup: images.fleetSignup,
      verify: images.fleetVerify,
      welcome: images.fleetWelcome,
    },
    signup: {
      captionLabel: "Fleet Manager",
      captionTitle: "Build your fleet operations account.",
      eyebrow: "Fleet operator account",
      title: "Create your Fleet company Account",
    },
    welcome: {
      verifiedBadge: "Verified Fleet Company",
      verifiedMessage:
        "Your fleet company is verified and ready to receive shipment opportunities from trusted shippers.",
      pendingMessage:
        "Your company is not verified yet. Upload your PACRA certificate below to verify your company and start finding shipments.",
      primaryLabel: "Find Shipments",
      primaryPath: "/fleet/opportunities",
      dashboardPath: "/fleet/dashboard",
    },
  },
};

export function getRole(key) {
  return ROLES[key] || null;
}
