"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalculatorIcon,
  CalendarIcon,
  GridIcon,
  LogoutIcon,
  OverviewIcon,
  RouteIcon,
  TruckIcon,
} from "@/components/fleet/icons";
import { endFleetSession, fetchCompany } from "@/lib/fleet/account";
import { fleetRoutes } from "@/lib/fleet/routes";
import { images } from "@/lib/images";
import "./FleetSidebar.css";

const FLEET_NAV = [
  {
    key: "overview",
    label: "Overview",
    href: fleetRoutes.dashboard,
    icon: OverviewIcon,
  },
  {
    key: "opportunities",
    label: "Opportunities",
    href: fleetRoutes.opportunities,
    icon: RouteIcon,
  },
  {
    key: "booked-loads",
    label: "Booked Loads",
    href: fleetRoutes.bookedLoads,
    icon: CalendarIcon,
  },
  {
    key: "fleet-setup",
    label: "Fleet Setup",
    href: fleetRoutes.fleetSetup,
    icon: TruckIcon,
  },
  {
    key: "cost-settings",
    label: "Cost settings",
    href: fleetRoutes.costSettings,
    icon: GridIcon,
  },
  {
    key: "cost-estimation",
    label: "Cost Estimation",
    href: fleetRoutes.costEstimation,
    icon: CalculatorIcon,
  },
];

function useBusinessName(onUnauthorised) {
  const [state, setState] = useState({ status: "loading", name: "" });

  useEffect(() => {
    let active = true;
    fetchCompany()
      .then((company) => {
        if (active) setState({ status: "ready", name: company.business_name });
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) onUnauthorised();
        else setState({ status: "failed", name: "" });
      });
    return () => {
      active = false;
    };
  }, [onUnauthorised]);

  return state;
}

export default function FleetSidebar({ active }) {
  const router = useRouter();
  const logout = useCallback(() => {
    endFleetSession();
    router.replace(fleetRoutes.login);
  }, [router]);
  const business = useBusinessName(logout);

  let businessName = business.name || "Your business";
  if (business.status === "loading") businessName = "Loading…";

  return (
    <aside className="fleet-sidebar">
      <Link
        href={fleetRoutes.dashboard}
        className="fleet-sidebar-brand"
        aria-label="ZamLine overview"
      >
        <span
          className="fleet-sidebar-mark"
          style={{ backgroundImage: `url(${images.logo})` }}
        />
        <span className="fleet-sidebar-wordmark">ZamLine</span>
      </Link>

      <p className="fleet-sidebar-heading">Fleet Manager</p>

      <nav className="fleet-sidebar-nav" aria-label="Fleet Manager">
        {FLEET_NAV.map((item) => {
          const ItemIcon = item.icon;
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={isActive ? "is-active" : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <ItemIcon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="fleet-sidebar-footer">
        <Link
          href={fleetRoutes.profile}
          className="fleet-sidebar-account"
          aria-current={active === "profile" ? "page" : undefined}
        >
          <span className="fleet-sidebar-avatar">FM</span>
          <div>
            <strong
              className={
                business.status === "loading" ? "is-loading" : undefined
              }
              title={business.name || undefined}
            >
              {businessName}
            </strong>
            <span>Fleet Manager</span>
          </div>
        </Link>

        <button type="button" className="fleet-sidebar-logout" onClick={logout}>
          <LogoutIcon />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
