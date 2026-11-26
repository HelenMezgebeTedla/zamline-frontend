import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-lg border border-slate-200 bg-white text-sm text-navy-950 shadow-xs transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/15";

export function Field({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children,
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline gap-1.5 text-sm font-medium text-navy-900"
      >
        {label}
        {optional ? (
          <span className="text-xs font-normal text-slate-500">Optional</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, leading, trailing, ...props }) {
  const input = (
    <input
      className={cn(
        control,
        "h-11 px-3.5",
        leading ? "pl-14" : "",
        trailing ? "pr-12" : "",
        className,
      )}
      {...props}
    />
  );
  if (!leading && !trailing) return input;
  return (
    <div className="relative">
      {leading ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-slate-500">
          {leading}
        </span>
      ) : null}
      {input}
      {trailing ? (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-medium text-slate-500">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export function SearchInput({ className, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        className={cn(control, "h-11 pl-10 pr-3.5")}
        {...props}
      />
    </div>
  );
}

export function Select({ className, children, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          control,
          "h-11 cursor-pointer appearance-none pl-3.5 pr-10",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(control, "min-h-32 resize-y px-3.5 py-3", className)}
      {...props}
    />
  );
}
