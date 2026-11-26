"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api, session } from "@/lib/api";
import { noEmailLink, readEmailLink } from "@/lib/emailLink";
import { images } from "@/lib/images";
import { uploadCertificate } from "@/lib/certificate";
import {
  clearPendingCertificate,
  getPendingCertificate,
} from "@/lib/pendingCertificate";
import { wrongPortal } from "@/lib/access";
import { getRole } from "@/lib/roles";
import "./VerifyEmailScreen.css";

const LENGTH = 6;
const RESEND_SECONDS = 60;
const EMPTY = Array(LENGTH).fill("");

function subscribeToNothing() {
  return () => {};
}

export default function VerifyEmailScreen({ role }) {
  const config = getRole(role);
  const router = useRouter();
  const link = useSyncExternalStore(
    subscribeToNothing,
    readEmailLink,
    noEmailLink,
  );
  const [typed, setTyped] = useState(null);
  const digits = typed ?? (link ? link.code.split("") : EMPTY);
  const savedEmail = useSyncExternalStore(
    subscribeToNothing,
    () => session.getEmail(),
    () => null,
  );
  const email = link?.email || savedEmail;
  const [error, setError] = useState("");
  const [otherPortal, setOtherPortal] = useState(null);
  const [shownNotice, setNotice] = useState(null);
  const notice =
    shownNotice ??
    (link
      ? "The code from your email is filled in. Press Verify & Continue."
      : "");
  const [status, setStatus] = useState("idle");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    const opened = readEmailLink();
    if (opened) session.setEmail(opened.email);
    const saved = session.getEmail();
    if (!saved) {
      router.replace(`${config.basePath}/login`);
      return;
    }
    inputs.current[0]?.focus();
  }, [router, config.basePath]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function setDigit(index, value) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setTyped((current) =>
        (current ?? digits).map((digit, i) => (i === index ? "" : digit)),
      );
      return;
    }
    setTyped((current) => {
      const next = [...(current ?? digits)];
      clean
        .split("")
        .slice(0, LENGTH - index)
        .forEach((digit, offset) => (next[index + offset] = digit));
      return next;
    });
    inputs.current[Math.min(index + clean.length, LENGTH - 1)]?.focus();
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0)
      inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0)
      inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < LENGTH - 1)
      inputs.current[index + 1]?.focus();
  }

  function handlePaste(event) {
    event.preventDefault();
    setDigit(0, event.clipboardData.getData("text").slice(0, LENGTH));
  }

  async function uploadSavedCertificate(companyId) {
    const file = await getPendingCertificate(companyId);
    if (!file) return true;

    setStatus("uploading");
    try {
      await uploadCertificate(companyId, file);
      await clearPendingCertificate();
      return true;
    } catch {
      return false;
    }
  }

  function signOut() {
    session.setToken(null);
    session.setCompanyId(null);
    session.setRole(null);
    session.setVerified(null);
    session.setEmail(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const code = digits.join("");
    if (code.length !== LENGTH || !email) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setError("");
    setStatus("verifying");
    try {
      const tokens = await api("/users/verify-otp", {
        body: { email, code, portal: config.key },
      });
      session.setTokens(tokens);

      const me = await api("/users/me", { auth: true });
      const companyId = me.company_id;
      session.setCompanyId(companyId);

      if (me.terms_accepted === false) {
        session.setEmail(null);
        session.setRole(config.key);
        router.push(
          `/terms?next=${encodeURIComponent(`${config.basePath}/welcome`)}`,
        );
        return;
      }

      const account = await api(`/companies/${companyId}`, { auth: true });
      const mismatch = wrongPortal(config.key, account.company_type);
      if (mismatch || !getRole(account.company_type)) {
        signOut();
        if (mismatch) setOtherPortal(mismatch);
        else setError("This account type is not supported.");
        setStatus("idle");
        return;
      }

      const uploaded = await uploadSavedCertificate(companyId);
      const company = uploaded
        ? await api(`/companies/${companyId}`, { auth: true })
        : account;
      session.setEmail(null);
      session.setRole(config.key);
      session.setVerified(company.verification_status === "verified");

      const nextPage = `${config.basePath}/welcome`;
      router.push(uploaded ? nextPage : `${nextPage}?upload=failed`);
    } catch (err) {
      setError(err.message || "Verification failed.");
      setTyped(EMPTY);
      inputs.current[0]?.focus();
      setStatus("idle");
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setError("");
    try {
      const result = await api("/users/resend-otp", { body: { email } });
      setNotice(result.message);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "Could not resend the code.");
    }
  }

  const busy = status !== "idle" || Boolean(otherPortal);

  return (
    <main className="auth-verify-page">
      <section className="auth-verify-photo">
        <div className="auth-verify-photo-media">
          <Image
            src={config.images.verify}
            alt=""
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
          />
        </div>
        <div className="auth-verify-shade" />
        <div className="auth-verify-logo">
          <Image
            src={images.logo}
            alt="ZamLine"
            width={95}
            height={105}
            priority
          />
        </div>
        <div className="auth-verify-caption">
          <p>ZamLine</p>
          <h2>Moving freight forward.</h2>
        </div>
      </section>

      <section className="auth-verify-panel">
        <div className="auth-verify-content">
          <p className="auth-verify-eyebrow">Email verification</p>
          <h1 className="auth-verify-title">Verify your email</h1>
          <p className="auth-verify-subtitle">
            We sent a 6-digit verification code to{" "}
            {email ? <strong>{email}</strong> : "your business email"}.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-verify-boxes">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputs.current[index] = el;
                  }}
                  className="auth-verify-box"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={LENGTH}
                  value={digit}
                  onChange={(e) => setDigit(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${index + 1}`}
                  disabled={busy}
                />
              ))}
            </div>

            {otherPortal && (
              <p className="auth-verify-error">
                This email is registered as a {otherPortal.label} account, so it
                cannot sign in here.{" "}
                <Link href={`${otherPortal.basePath}/login`}>
                  Log in as {otherPortal.label}
                </Link>
              </p>
            )}
            {error && <p className="auth-verify-error">{error}</p>}
            {notice && !error && <p className="auth-verify-notice">{notice}</p>}

            <button
              className="auth-verify-button"
              type="submit"
              disabled={busy}
            >
              {status === "verifying" && "Verifying…"}
              {status === "uploading" && "Checking your certificate…"}
              {status === "idle" && "Verify & Continue"}
            </button>

            <button
              type="button"
              className="auth-verify-resend"
              onClick={handleResend}
              disabled={busy || cooldown > 0}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
