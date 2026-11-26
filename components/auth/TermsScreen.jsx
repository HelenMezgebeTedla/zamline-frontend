"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { api, session } from "@/lib/api";
import { images } from "@/lib/images";
import { getRole } from "@/lib/roles";
import { clearSession } from "@/lib/session";
import { TERMS_EFFECTIVE, TERMS_SECTIONS, TERMS_VERSION } from "@/lib/terms";
import "./TermsScreen.css";

function subscribeToNothing() {
  return () => {};
}

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/terms")) return null;
  return value;
}

function homeFor(role) {
  const config = getRole(role === "fleet_manager" ? "fleet" : role);
  return config ? `${config.basePath}/welcome` : "/";
}

function TermsCard() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const token = useSyncExternalStore(
    subscribeToNothing,
    () => session.getToken(),
    () => undefined,
  );
  const [answer, setAnswer] = useState("loading");
  const [role, setRole] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    api("/users/me", { auth: true })
      .then((me) => {
        if (!active) return;
        setRole(me.role);
        setAnswer(me.terms_accepted === false ? "accept" : "read");
      })
      .catch(() => {
        if (active) setAnswer("read");
      });
    return () => {
      active = false;
    };
  }, [token]);

  let state = answer;
  if (token === undefined) state = "loading";
  else if (token === null) state = "read";

  async function handleAccept() {
    if (!agreed) {
      setError("Tick the box to confirm you agree to the Terms and Policy.");
      return;
    }
    setError("");
    setAnswer("saving");
    try {
      await api("/users/accept-terms", { method: "POST", auth: true });
      router.replace(next || homeFor(role));
    } catch (err) {
      setError(err.message || "Could not save your answer. Please try again.");
      setAnswer("accept");
    }
  }

  function handleDecline() {
    const config = getRole(role === "fleet_manager" ? "fleet" : role);
    clearSession();
    router.replace(config ? `${config.basePath}/login` : "/");
  }

  const asking = state === "accept" || state === "saving";

  return (
    <article className="auth-terms-card">
      <p className="auth-terms-eyebrow">ZamLine</p>
      <h1 className="auth-terms-title">Terms and Policy</h1>
      <p className="auth-terms-meta">
        Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE}
      </p>

      {asking && (
        <p className="auth-terms-notice" role="status">
          Please read and accept the Terms and Policy before you continue using
          ZamLine.
        </p>
      )}

      <div
        className="auth-terms-body"
        tabIndex={0}
        aria-label="Terms and Policy text"
      >
        {TERMS_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`terms-${section.id}`}>
            <h2 id={`terms-${section.id}`}>{section.title}</h2>
            <ul>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {asking ? (
        <div className="auth-terms-actions">
          <label className="auth-terms-check">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I have read and agree to the ZamLine Terms and Policy
          </label>
          {error && <p className="auth-terms-error">{error}</p>}
          <button
            type="button"
            className="auth-terms-button"
            onClick={handleAccept}
            disabled={state === "saving"}
          >
            {state === "saving" ? "Saving…" : "Accept and continue"}
          </button>
          <button
            type="button"
            className="auth-terms-decline"
            onClick={handleDecline}
            disabled={state === "saving"}
          >
            Decline and log out
          </button>
        </div>
      ) : (
        state === "read" && (
          <div className="auth-terms-actions">
            <Link className="auth-terms-back" href={next || "/"}>
              Back
            </Link>
          </div>
        )
      )}
    </article>
  );
}

export default function TermsScreen() {
  return (
    <main className="auth-terms-page">
      <div className="auth-terms-logo">
        <Image src={images.logo} alt="ZamLine" width={64} height={71} />
      </div>
      <Suspense fallback={<p className="auth-terms-meta">Loading…</p>}>
        <TermsCard />
      </Suspense>
    </main>
  );
}
