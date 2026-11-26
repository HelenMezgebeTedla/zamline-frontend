"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import {
  noEmailLink,
  readEmailLink,
  subscribeToNothing,
} from "@/lib/emailLink";
import { images } from "@/lib/images";
import { getRole } from "@/lib/roles";
import { blockedHint, check, clean, passwordProblem } from "@/lib/validation";
import "./LoginScreen.css";

export default function ForgotPasswordScreen({ role }) {
  const config = getRole(role);
  const link = useSyncExternalStore(
    subscribeToNothing,
    readEmailLink,
    noEmailLink,
  );
  const [chosenStep, setStep] = useState(null);
  const [typedEmail, setEmail] = useState(null);
  const [typedCode, setCode] = useState(null);
  const step = chosenStep ?? (link ? "code" : "email");
  const email = typedEmail ?? link?.email ?? "";
  const code = typedCode ?? link?.code ?? "";
  const [codeHint, setCodeHint] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shownNotice, setNotice] = useState(null);
  const notice =
    shownNotice ??
    (link
      ? "The code from your email is filled in. Now choose your new password."
      : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event) {
    event?.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim()) return setError("Please enter your business email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      return setError("Enter a valid email address, like name@company.com.");

    setLoading(true);
    try {
      const result = await api("/users/forgot-password", {
        body: { email: email.trim() },
      });
      setNotice(
        `${result.message}. Check your inbox and spam folder for an email from ZamLine.`,
      );
      setCooldown(60);
      setStep("code");
    } catch (err) {
      setError(err.message || "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function updateCode(typed) {
    const { value, blocked } = clean("code", typed);
    setCode(value);
    setCodeHint(blocked ? blockedHint("code") : "");
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    const codeProblem = check("code", code);
    if (codeProblem) return setError(codeProblem);
    const weakPassword = passwordProblem(password, email);
    if (weakPassword) return setError(weakPassword);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await api("/users/reset-password", {
        body: {
          email: email.trim(),
          code,
          new_password: password,
          confirm_password: confirm,
        },
      });
      setPassword("");
      setConfirm("");
      setStep("done");
    } catch (err) {
      setError(err.message || "Could not reset the password.");
    } finally {
      setLoading(false);
    }
  }

  const eyeButton = (
    <button
      type="button"
      className="auth-login-eye"
      onClick={() => setShowPassword((shown) => !shown)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
        {showPassword && <line x1="3" y1="21" x2="21" y2="3" />}
      </svg>
    </button>
  );

  return (
    <main className="auth-login-page">
      <section className="auth-login-photo">
        <div className="auth-login-photo-media">
          <Image
            src={config.images.login}
            alt=""
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
          />
        </div>
        <div className="auth-login-shade" />
        <div className="auth-login-logo">
          <Image
            src={images.logo}
            alt="ZamLine"
            width={95}
            height={105}
            priority
          />
        </div>
        <div className="auth-login-caption">
          <p>ZamLine</p>
          <h2>Freight decisions, made clearer.</h2>
        </div>
      </section>

      <section className="auth-login-panel">
        <div className="auth-login-content">
          <p className="auth-login-eyebrow">{config.label} account</p>

          {step === "email" && (
            <>
              <h1 className="auth-login-title">Forgot password</h1>
              <p className="auth-login-subtitle">
                Enter your business email and we&apos;ll send you a code to
                reset your password.
              </p>
              <form className="auth-login-form" onSubmit={sendCode} noValidate>
                <div className="auth-login-field">
                  <label htmlFor="email">Business email</label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                {error && <p className="auth-login-error">{error}</p>}
                <button
                  className="auth-login-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending code…" : "Send reset code"}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <h1 className="auth-login-title">Reset your password</h1>
              <p className="auth-login-subtitle">
                Enter the 6-digit code sent to <strong>{email.trim()}</strong>{" "}
                and choose a new password.
              </p>
              <form
                className="auth-login-form"
                onSubmit={resetPassword}
                noValidate
              >
                {notice && <p className="auth-login-notice">{notice}</p>}
                <div className="auth-login-field">
                  <label htmlFor="code">Reset code</label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => updateCode(e.target.value)}
                    required
                  />
                  {codeHint && (
                    <p className="auth-login-hint" role="status">
                      {codeHint}
                    </p>
                  )}
                </div>
                <div className="auth-login-field">
                  <label htmlFor="new-password">New password</label>
                  <div className="auth-login-password">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8+ characters: A-Z, a-z, 0-9 and a symbol"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    {eyeButton}
                  </div>
                </div>
                <div className="auth-login-field">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Type the new password again"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {error && <p className="auth-login-error">{error}</p>}
                <button
                  className="auth-login-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Reset password"}
                </button>
                <p className="auth-login-footer">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    className="auth-login-link"
                    onClick={() => sendCode()}
                    disabled={loading || cooldown > 0}
                  >
                    {cooldown > 0
                      ? `Send it again in ${cooldown}s`
                      : "Send it again"}
                  </button>
                </p>
              </form>
            </>
          )}

          {step === "done" && (
            <>
              <h1 className="auth-login-title">Password changed</h1>
              <p className="auth-login-notice">
                Your password has been reset. You can now log in with your new
                password.
              </p>
              <Link
                className="auth-login-button"
                href={`${config.basePath}/login`}
              >
                Back to log in
              </Link>
            </>
          )}

          {step !== "done" && (
            <p className="auth-login-footer">
              Remembered it?{" "}
              <Link href={`${config.basePath}/login`}>Log in</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
