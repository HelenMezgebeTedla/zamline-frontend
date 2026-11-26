"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { api, session } from "@/lib/api";
import { LOGIN_PATH, WELCOME_PATH } from "@/lib/config";
import { getRole } from "@/lib/roles";
import { clearSession } from "@/lib/session";

async function checkAccess() {
  const token = session.getToken();
  const companyId = session.getCompanyId();

  if (!token || !companyId) {
    return { redirect: LOGIN_PATH };
  }

  try {
    const me = await api("/users/me", { auth: true });

    if (me.company_id && String(me.company_id) !== String(companyId)) {
      return { redirect: LOGIN_PATH };
    }

    const company = await api(`/companies/${companyId}`, {
      auth: true,
    });

    if (company.company_type !== "shipper") {
      const role = getRole(company.company_type);

      return {
        redirect: role ? `${role.basePath}/welcome` : LOGIN_PATH,
      };
    }

    const verified = company.verification_status === "verified";

    session.setRole("shipper");
    session.setVerified(verified);

    return {
      redirect: verified ? null : WELCOME_PATH,
    };
  } catch (error) {
    if (error?.status === 401) {
      clearSession();
      return { redirect: LOGIN_PATH };
    }

    return {
      error:
        "We couldn't verify your access. Check your connection and try again.",
    };
  }
}

export function ShipperGuard({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const verifyAccess = useCallback(async () => {
    setChecking(true);
    setError("");

    try {
      const result = await checkAccess();

      if (result.error) {
        setAllowed(false);
        setError(result.error);
        return;
      }

      if (result.redirect === null) {
        setAllowed(true);
        return;
      }

      router.replace(result.redirect);
    } catch {
      setAllowed(false);
      setError(
        "We couldn't verify your access. Check your connection and try again.",
      );
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const runCheck = async () => {
      if (!active) {
        return;
      }

      await verifyAccess();
    };

    const timer = setTimeout(runCheck, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [verifyAccess]);

  if (allowed) {
    return <>{children}</>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6" role="alert">
        <h2 className="text-lg font-semibold">Unable to verify access</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Button onClick={verifyAccess} disabled={checking}>
          {checking ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
