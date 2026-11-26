import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  error: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: CircleAlert,
    iconColor: "text-red-600",
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CircleCheck,
    iconColor: "text-emerald-600",
  },
  info: {
    box: "border-brand-200 bg-brand-50 text-navy-900",
    icon: Info,
    iconColor: "text-brand-600",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-900",
    icon: TriangleAlert,
    iconColor: "text-amber-600",
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}) {
  const { box, icon: Icon, iconColor } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3.5 text-sm",
        box,
        className,
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={cn(title ? "mt-0.5" : "", "opacity-90")}>
            {children}
          </div>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 h-fit rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
