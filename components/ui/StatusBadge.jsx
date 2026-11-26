import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const styles = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  expired: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function StatusBadge({ status, className }) {
  const normalizedStatus = String(status || "").toLowerCase();

  let displayLabel = normalizedStatus === "accepted" ? "Active" : "";

  if (!displayLabel) {
    displayLabel =
      STATUS_LABELS[normalizedStatus] ||
      STATUS_LABELS[status] ||
      normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  }

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[length:calc(13px*var(--zl-text))] font-medium ring-1 ring-inset",
        styles[normalizedStatus] || "bg-slate-50 text-slate-700 ring-slate-200",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {displayLabel}
    </span>
  );
}
