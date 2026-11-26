"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  LayoutGrid,
  LogOut,
  Menu,
  SquarePlus,
  Truck,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_SHIPMENTS_PATH,
  LOGIN_PATH,
  PROFILE_PATH,
} from "@/lib/config";
import { initials } from "@/lib/format";
import { clearSession } from "@/lib/session";

const NAVIGATION = {
  label: "Shipper",
  account: "Shipper account",
  home: "/shipper/dashboard",
  items: [
    { href: "/shipper/dashboard", label: "Dashboard", icon: LayoutGrid },
    {
      href: "/shipper/shipments/new",
      label: "Post Shipment",
      icon: SquarePlus,
    },
    { href: "/shipper/shipments", label: "Current Shipments", icon: Truck },
    {
      href: ACCEPTED_SHIPMENTS_PATH,
      label: "Accepted Shipments",
      icon: UserCheck,
    },
  ],
};

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function activeItem(pathname) {
  return NAVIGATION.items
    .filter((entry) => isActive(pathname, entry.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function breadcrumbs(pathname) {
  const trail = [NAVIGATION.label];
  if (pathname === PROFILE_PATH) return [...trail, "Profile"];
  const item = activeItem(pathname);
  if (!item) return trail;
  trail.push(item.label);
  if (pathname !== item.href) trail.push("Details");
  if (pathname.endsWith("/edit")) trail.push("Edit");
  return trail;
}

function navLinkClass(active) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
      : "text-[#A9C4D8] hover:bg-white/10 hover:text-white",
  );
}

function NavList({ pathname, onNavigate }) {
  const current = pathname === "" ? undefined : activeItem(pathname);
  return (
    <ul className="mt-3 space-y-1">
      {NAVIGATION.items.map(({ href, label, icon: Icon }) => {
        const active = current?.href === href;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              <Icon aria-hidden className="size-[18px]" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CurrentNavList({ onNavigate }) {
  const pathname = usePathname();
  return <NavList pathname={pathname} onNavigate={onNavigate} />;
}

function Sidebar({ onNavigate }) {
  const router = useRouter();
  const onProfile = usePathname() === PROFILE_PATH;
  const user = useCurrentUser();
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");

  function logOut() {
    clearSession();
    onNavigate?.();
    router.replace(LOGIN_PATH);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-7">
        <Link
          href={NAVIGATION.home}
          onClick={onNavigate}
          className="inline-block"
        >
          <Image
            src="/image/zlogo.png"
            alt="ZamLine"
            width={95}
            height={105}
            priority
            className="h-auto w-20"
          />
        </Link>
      </div>

      <nav aria-label="Main" className="mt-8 flex-1 px-4">
        <p className="px-3 text-[length:calc(11px*var(--zl-text))] font-semibold uppercase tracking-[0.2em] text-cream">
          {NAVIGATION.label}
        </p>
        <Suspense fallback={<NavList pathname="" onNavigate={onNavigate} />}>
          <CurrentNavList onNavigate={onNavigate} />
        </Suspense>
      </nav>

      <div className="border-t border-white/10 px-4 py-5">
        <p className="px-3 text-[length:calc(11px*var(--zl-text))] font-semibold uppercase tracking-[0.2em] text-cream">
          Account
        </p>
        <ul className="mt-3 space-y-1">
          <li>
            <Link
              href={PROFILE_PATH}
              onClick={onNavigate}
              className={navLinkClass(onProfile)}
              aria-current={onProfile ? "page" : undefined}
            >
              <User aria-hidden className="size-[18px]" />
              Profile
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={logOut}
              className={cn(navLinkClass(false), "w-full")}
            >
              <LogOut aria-hidden className="size-[18px]" />
              Log out
            </button>
          </li>
        </ul>
        <div className="mt-5 flex items-center gap-3 border-t border-white/10 px-3 pt-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            {initials(
              user?.first_name ?? undefined,
              user?.last_name ?? undefined,
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-cream">
              {fullName || "Your account"}
            </p>
            <p className="truncate text-xs text-cream">{NAVIGATION.account}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreadcrumbTrail({ trail }) {
  return (
    <ol className="flex items-center gap-1.5 text-sm">
      {trail.map((crumb, index) => {
        const last = index === trail.length - 1;
        return (
          <li
            key={`${crumb}-${index}`}
            className={cn(
              "flex min-w-0 items-center gap-1.5",
              index > 1 && !last ? "hidden sm:flex" : "",
            )}
          >
            {index > 0 ? (
              <ChevronRight
                aria-hidden
                className="size-3.5 shrink-0 text-slate-400"
              />
            ) : null}
            <span
              aria-current={last ? "page" : undefined}
              className={cn(
                "truncate",
                last ? "font-medium text-navy-950" : "text-slate-500",
              )}
            >
              {crumb}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CurrentBreadcrumbs() {
  const pathname = usePathname();
  return <BreadcrumbTrail trail={breadcrumbs(pathname)} />;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function MobileMenu({ onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" onKeyDown={handleKeyDown}>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 bg-navy-950/50"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className="relative h-full w-72 max-w-[85vw] overflow-y-auto bg-navy-950 shadow-2xl"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-cream hover:bg-white/10 hover:text-white"
        >
          <X aria-hidden className="size-5" />
        </button>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  function closeMenu() {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <div className="hidden bg-navy-950 lg:block">
        <aside className="sticky top-0 h-dvh overflow-y-auto">
          <Sidebar />
        </aside>
      </div>

      {menuOpen ? <MobileMenu onClose={closeMenu} /> : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
            className="-ml-1 rounded-lg p-2 text-navy-900 hover:bg-slate-100 lg:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <Suspense fallback={<BreadcrumbTrail trail={[NAVIGATION.label]} />}>
              <CurrentBreadcrumbs />
            </Suspense>
          </nav>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-semibold text-white">
            {initials(
              user?.first_name ?? undefined,
              user?.last_name ?? undefined,
            )}
          </span>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
