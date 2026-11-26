"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, session } from "@/lib/api";
import { images } from "@/lib/images";
import { getRole } from "@/lib/roles";
import "./LoginScreen.css";

export default function LoginScreen({ role }) {
  const config = getRole(role);
  const router = useRouter();
  const sessionExpiredMessage =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("message") ===
        "session-expired"
        ? "Your session expired. Please log in again."
        : ""
      : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/users/login", {
        body: { email: email.trim(), password, portal: config.key },
      });
      session.setEmail(email.trim().toLowerCase());
      session.setCompanyId(null);
      session.setRole(null);
      session.setVerified(null);
      session.setToken(null);
      router.push(`${config.basePath}/verify-email`);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

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
          <p className="auth-login-eyebrow">Business account</p>
          <h1 className="auth-login-title">Welcome back</h1>
          <p className="auth-login-subtitle">
            Sign in to continue to your ZamLine account.
          </p>

          {sessionExpiredMessage && (
            <p className="auth-login-error" role="alert">
              {sessionExpiredMessage}
            </p>
          )}

          <form className="auth-login-form" onSubmit={handleSubmit}>
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

            <div className="auth-login-field">
              <label htmlFor="password">Password</label>
              <div className="auth-login-password">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
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
              </div>
            </div>

            <Link
              className="auth-login-forgot"
              href={`${config.basePath}/forgot-password`}
            >
              Forgot password?
            </Link>

            {error && <p className="auth-login-error">{error}</p>}

            <button
              className="auth-login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Log In"}
            </button>

            <p className="auth-login-footer">
              Don&apos;t have an account?{" "}
              <Link href={`${config.basePath}/signup`}>Create account</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
