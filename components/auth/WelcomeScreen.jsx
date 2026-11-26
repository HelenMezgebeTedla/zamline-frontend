"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import CertificateRetry from "@/components/CertificateRetry";
import { api, session } from "@/lib/api";
import { images } from "@/lib/images";
import { useRequireRole } from "@/hooks/useRequireRole";
import { getRole } from "@/lib/roles";
import "./WelcomeScreen.css";

function WelcomeCard({ config }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");

  const loadCompany = useCallback(() => {
    const companyId = session.getCompanyId();
    if (!session.getToken() || !companyId) {
      router.replace(`${config.basePath}/login`);
      return;
    }
    api(`/companies/${companyId}`, { auth: true })
      .then((data) => {
        const accountRole = getRole(data.company_type);
        if (accountRole && accountRole.key !== config.key) {
          session.setRole(accountRole.key);
          router.replace(`${accountRole.basePath}/welcome`);
          return;
        }
        session.setVerified(data.verification_status === "verified");
        setCompany(data);
      })
      .catch((err) => {
        if (err.status === 401) {
          session.setToken(null);
          router.replace(`${config.basePath}/login`);
          return;
        }
        setError(err.message);
      });
  }, [router, config]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  function handleUploaded() {
    router.replace(pathname);
    loadCompany();
  }

  if (error) return <p className="auth-welcome-error">{error}</p>;
  if (!company) return <p className="auth-welcome-text">Loading…</p>;

  const status = company.verification_status;
  const verified = status === "verified";
  const failed = ["resubmit", "rejected"].includes(status);
  const uploadFailed = params.get("upload") === "failed";
  const needsCertificate = !verified;

  let badge = "Unverified";
  let badgeClass = "is-pending";
  let message = config.welcome.pendingMessage;
  if (verified) {
    badge = config.welcome.verifiedBadge;
    badgeClass = "";
    message = config.welcome.verifiedMessage;
  } else if (failed) {
    badge = "Verification failed";
    badgeClass = "is-failed";
    message = `${
      company.verification_failure_reason ||
      "Your PACRA certificate could not be verified."
    } Please upload a valid PACRA certificate to continue.`;
  } else if (uploadFailed) {
    message =
      "We couldn't check your certificate right now. Please try uploading it again later.";
  }

  return (
    <>
      <h1 className="auth-welcome-title">Welcome to Zamline</h1>
      <span className={`auth-welcome-badge ${badgeClass}`}>{badge}</span>
      <p className={`auth-welcome-text ${failed ? "is-failed" : ""}`}>
        {message}
      </p>

      {needsCertificate && (
        <CertificateRetry
          companyId={session.getCompanyId()}
          onUploaded={handleUploaded}
        />
      )}

      <div className="auth-welcome-actions">
        <button
          type="button"
          className="auth-welcome-button"
          disabled={!verified}
          onClick={() => router.push(config.welcome.primaryPath)}
        >
          {config.welcome.primaryLabel}
        </button>
        <button
          type="button"
          className="auth-welcome-button is-outline"
          disabled={!verified}
          onClick={() => router.push(config.welcome.dashboardPath)}
        >
          Go to dashboard
        </button>
      </div>
    </>
  );
}

export default function WelcomeScreen({ role }) {
  const config = getRole(role);
  const allowed = useRequireRole(role);

  return (
    <main className="auth-welcome-page">
      <Image
        src={config.images.welcome}
        alt=""
        fill
        priority
        sizes="100vw"
        className="auth-welcome-bg"
      />
      <div className="auth-welcome-logo">
        <Image
          src={images.logo}
          alt="ZamLine"
          width={95}
          height={105}
          loading="eager"
        />
      </div>
      <div className="auth-welcome-card">
        <Suspense fallback={<p className="auth-welcome-text">Loading…</p>}>
          {allowed ? (
            <WelcomeCard config={config} />
          ) : (
            <p className="auth-welcome-text">Loading…</p>
          )}
        </Suspense>
      </div>
    </main>
  );
}
