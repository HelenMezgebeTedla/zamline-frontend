"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api, session } from "@/lib/api";
import { images } from "@/lib/images";
import { certificateError } from "@/lib/certificate";
import {
  clearPendingCertificate,
  savePendingCertificate,
} from "@/lib/pendingCertificate";
import { getRole } from "@/lib/roles";
import {
  blockedHint,
  check,
  clean,
  inputRule,
  passwordProblem,
} from "@/lib/validation";
import "./SignupScreen.css";

const emptyForm = {
  business_name: "",
  registration_number: "",
  company_email: "",
  phone_number: "",
  first_name: "",
  last_name: "",
  password: "",
  confirm_password: "",
};

const businessFields = [
  {
    name: "business_name",
    label: "Business name",
    type: "text",
    autoComplete: "organization",
    placeholder: "e.g. Lusaka Freight Ltd",
  },
  {
    name: "registration_number",
    label: "Registration number",
    type: "text",
    autoComplete: "off",
    inputMode: "numeric",
    placeholder: "e.g. 120180010448",
  },
  {
    name: "company_email",
    label: "Business email",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    placeholder: "name@company.com",
  },
  {
    name: "phone_number",
    label: "Business phone number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    placeholder: "+260971234567",
  },
];

const accountFields = [
  {
    name: "first_name",
    label: "First name",
    type: "text",
    autoComplete: "given-name",
    placeholder: "e.g. Mary",
  },
  {
    name: "last_name",
    label: "Last name",
    type: "text",
    autoComplete: "family-name",
    placeholder: "e.g. Banda",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "8+ characters: A-Z, a-z, 0-9 and a symbol",
  },
  {
    name: "confirm_password",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "Type the password again",
  },
];

export default function SignupScreen({ role }) {
  const config = getRole(role);
  const router = useRouter();
  const fileInput = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [showPasswords, setShowPasswords] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [hints, setHints] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(name, typed) {
    const { value, blocked } = clean(name, typed);
    setForm((current) => ({ ...current, [name]: value }));
    setHints((current) => ({
      ...current,
      [name]: blocked ? blockedHint(name) : "",
    }));
  }

  function chooseFile(file) {
    if (!file) return;
    const problem = certificateError(file);
    if (problem) return setError(problem);
    setError("");
    setCertificate(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const empty = [...businessFields, ...accountFields].find(
      (field) => !form[field.name].trim(),
    );
    if (empty) return setError(`Please fill in ${empty.label.toLowerCase()}.`);
    const invalid = [...businessFields, ...accountFields]
      .map((field) => check(field.name, form[field.name]))
      .find(Boolean);
    if (invalid) return setError(invalid);
    const weakPassword = passwordProblem(form.password, form.company_email);
    if (weakPassword) return setError(weakPassword);
    if (form.password !== form.confirm_password)
      return setError("Passwords do not match.");
    if (!certificate) return setError("Please upload your PACRA certificate.");
    if (!acceptedTerms)
      return setError(
        "Please accept the Terms and Policy to create your account.",
      );

    setLoading(true);
    await clearPendingCertificate();
    try {
      const result = await api("/users/register", {
        body: {
          ...form,
          business_name: form.business_name.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          company_type: config.key,
          accept_terms: true,
        },
      });
      session.setEmail(form.company_email.trim().toLowerCase());
      session.setCompanyId(result.company.company_id);
      await savePendingCertificate(certificate, result.company.company_id);
      router.push(`${config.basePath}/verify-email`);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function renderField(field) {
    const isPassword = field.type === "password";
    const rule = inputRule(field.name);
    const hint = hints[field.name];
    return (
      <div className="auth-signup-field" key={field.name}>
        <label htmlFor={field.name}>{field.label}</label>
        <input
          id={field.name}
          type={isPassword && showPasswords ? "text" : field.type}
          inputMode={field.inputMode}
          placeholder={field.placeholder}
          maxLength={rule?.maxLength}
          value={form[field.name]}
          onChange={(e) => updateField(field.name, e.target.value)}
          autoComplete={field.autoComplete}
          aria-describedby={hint ? `${field.name}-hint` : undefined}
          required
        />
        {hint && (
          <p
            className="auth-signup-hint"
            id={`${field.name}-hint`}
            role="status"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="auth-signup-page">
      <section className="auth-signup-photo">
        <div className="auth-signup-photo-media">
          <Image
            src={config.images.signup}
            alt=""
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
          />
        </div>
        <div className="auth-signup-shade" />
        <div className="auth-signup-logo">
          <Image
            src={images.logo}
            alt="ZamLine"
            width={95}
            height={105}
            priority
          />
        </div>
        <div className="auth-signup-caption">
          <p>{config.signup.captionLabel}</p>
          <h2>{config.signup.captionTitle}</h2>
        </div>
      </section>

      <section className="auth-signup-panel">
        <div className="auth-signup-content">
          <p className="auth-signup-eyebrow">{config.signup.eyebrow}</p>

          <form className="auth-signup-card" onSubmit={handleSubmit} noValidate>
            <h1 className="auth-signup-title">{config.signup.title}</h1>

            <p className="auth-signup-section">Business details</p>
            <div className="auth-signup-grid">
              {businessFields.map(renderField)}
            </div>

            <hr className="auth-signup-divider" />

            <p className="auth-signup-section">Account details</p>
            <div className="auth-signup-grid">
              {accountFields.map(renderField)}
            </div>

            <label className="auth-signup-show">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              Show passwords
            </label>

            <hr className="auth-signup-divider" />

            <p className="auth-signup-section">Business verification</p>
            <p className="auth-signup-upload-label">Upload PACRA Certificate</p>
            <div
              className={`auth-signup-dropzone ${dragging ? "is-dragging" : ""}`}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                chooseFile(e.dataTransfer.files[0]);
              }}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                hidden
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M16 16l-4-4-4 4" />
                <path d="M12 12v9" />
                <path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3" />
              </svg>
              <p className="drop-title">
                <span className="drop-desktop">
                  Drag and drop your certificate here
                </span>
                <span className="drop-mobile">
                  Tap to choose your certificate
                </span>
              </p>
              <p className="drop-browse">or Browse file</p>
              <p className="drop-hint">PDF, JPG or PNG · Max 10 MB</p>
              {certificate && <p className="drop-file">✓ {certificate.name}</p>}
            </div>

            <label className="auth-signup-terms">
              <input
                id="accept_terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms and Policy
                </Link>
              </span>
            </label>

            {error && <p className="auth-signup-error">{error}</p>}

            <button
              className="auth-signup-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p className="auth-signup-footer">
              Already have an account?{" "}
              <Link href={`${config.basePath}/login`}>Log in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
