"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { accessRedirect } from "@/lib/access";
import { session } from "@/lib/api";

function subscribeToNothing() {
  return () => {};
}

export function useRequireRole(role, { requireVerified = false } = {}) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToNothing,
    () => session.getToken(),
    () => undefined,
  );
  const myRole = useSyncExternalStore(
    subscribeToNothing,
    () => session.getRole(),
    () => undefined,
  );
  const verified = useSyncExternalStore(
    subscribeToNothing,
    () => session.getVerified(),
    () => false,
  );

  const checking = token === undefined;
  const redirect = checking
    ? null
    : accessRedirect({ token, myRole, verified, role, requireVerified });

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  return !checking && redirect === null;
}
