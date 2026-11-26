import { cn } from "@/lib/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,27,45,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function DetailCard({ icon: Icon, title, className, children }) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon aria-hidden className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function DetailItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy-950">{value}</dd>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-navy-950">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
    </Card>
  );
}
