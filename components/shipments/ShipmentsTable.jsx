import Link from "next/link";
import { ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime, formatMoney, formatWeight } from "@/lib/format";

import { RouteLabel } from "./RouteLabel";

const headCell =
  "px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
const bodyCell = "px-5 py-4 align-middle text-sm text-slate-700";

export function ShipmentsTable({ shipments, compact = false }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-brand-50/60">
            <tr>
              <th scope="col" className={headCell}>
                Route
              </th>
              <th scope="col" className={headCell}>
                {compact ? "Details" : "Cargo / weight"}
              </th>
              {compact ? null : (
                <th scope="col" className={headCell}>
                  Pickup
                </th>
              )}
              <th scope="col" className={headCell}>
                Status
              </th>
              <th scope="col" className={headCell}>
                {compact ? "Proposed price" : "Price"}
              </th>
              <th scope="col" className={headCell}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shipments.map((shipment) => (
              <tr
                key={shipment.shipment_id}
                className="transition-colors hover:bg-slate-50/70"
              >
                <td className={`${bodyCell} text-navy-950`}>
                  <RouteLabel
                    origin={shipment.origin_address}
                    destination={shipment.destination_address}
                  />
                </td>
                <td className={bodyCell}>
                  <span className="block font-medium text-navy-900">
                    {shipment.cargo_type}
                  </span>
                  <span className="text-slate-500">
                    {formatWeight(shipment.weight_kg)}
                  </span>
                </td>
                {compact ? null : (
                  <td className={`${bodyCell} whitespace-nowrap`}>
                    {formatDateTime(shipment.pickup_time)}
                  </td>
                )}
                <td className={bodyCell}>
                  <StatusBadge status={shipment.status} />
                </td>
                <td
                  className={`${bodyCell} whitespace-nowrap font-semibold text-navy-950`}
                >
                  {formatMoney(shipment.proposed_amount)}
                </td>
                <td className={`${bodyCell} text-right`}>
                  <Link
                    href={`/shipper/shipments/${shipment.shipment_id}`}
                    className="whitespace-nowrap font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {shipments.map((shipment) => (
          <li key={shipment.shipment_id}>
            <Link
              href={`/shipper/shipments/${shipment.shipment_id}`}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <RouteLabel
                    origin={shipment.origin_address}
                    destination={shipment.destination_address}
                    className="text-sm text-navy-950"
                  />
                  <StatusBadge status={shipment.status} className="shrink-0" />
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                  {shipment.cargo_type} · {formatWeight(shipment.weight_kg)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">
                    {formatDateTime(shipment.pickup_time)}
                  </span>
                  <span className="font-semibold text-navy-950">
                    {formatMoney(shipment.proposed_amount)}
                  </span>
                </div>
              </div>
              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 text-slate-400"
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
