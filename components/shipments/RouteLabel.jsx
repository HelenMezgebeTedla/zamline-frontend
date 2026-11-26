import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { cityOf } from "@/lib/format";

export function RouteLabel({ origin, destination, className }) {
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5",
        className,
      )}
    >
      <span className="font-semibold">{cityOf(origin)}</span>
      <ArrowRight
        aria-label="to"
        className="size-3.5 shrink-0 text-slate-400"
      />
      <span>{cityOf(destination)}</span>
    </span>
  );
}
