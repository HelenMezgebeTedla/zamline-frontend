import Link from "next/link";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary:
    "bg-navy-900 text-white hover:bg-navy-800 focus-visible:outline-navy-700",
  brand:
    "bg-brand-500 text-white hover:bg-brand-600 focus-visible:outline-brand-600",
  secondary:
    "border border-slate-200 bg-white text-navy-900 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-brand-500",
  ghost: "text-navy-700 hover:bg-navy-50 focus-visible:outline-brand-500",
  danger:
    "border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50 focus-visible:outline-red-500",
  dangerSolid:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

const sizes = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
