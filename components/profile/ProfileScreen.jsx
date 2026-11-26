"use client";

import FleetPage, { FleetHeader } from "@/components/fleet/FleetPage";
import { ShipperPage } from "@/components/layout/ShipperPage";
import { PageHeader } from "@/components/ui/Feedback";
import Icon from "@/components/ui/Icon";
import { useAccount } from "@/hooks/useAccount";
import { fullName, formatDate, initials } from "@/lib/format";
import { NAVIGATION } from "@/lib/navigation";
import "@/components/ui/ui.css";
import "./ProfileScreen.css";

const VERIFICATION = {
  verified: {
    icon: "shieldCheck",
    title: "Business verified",
    text: "Your account is ready to work with verified partners on ZamLine.",
    badge: "Verified",
  },
  pending: {
    icon: "clock",
    title: "Verification in progress",
    text: "Your PACRA certificate is being reviewed. We'll let you know once it's done.",
    badge: "Pending",
  },
  resubmit: {
    icon: "alert",
    title: "Certificate needs resubmitting",
    text: "Please upload a clearer copy of your PACRA certificate.",
    badge: "Resubmit",
  },
  rejected: {
    icon: "alert",
    title: "Verification was not approved",
    text: "Contact support if you think this is a mistake.",
    badge: "Rejected",
  },
};

function Detail({ label, children }) {
  return (
    <div className="profile-detail">
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="profile-grid" aria-busy="true" aria-label="Loading profile">
      <div className="zl-card profile-skeleton">
        <div className="zl-skeleton profile-skeleton-head" />
        <div className="zl-skeleton" />
        <div className="zl-skeleton" />
      </div>
      <div className="zl-card profile-skeleton">
        <div className="zl-skeleton" />
        <div className="zl-skeleton" />
      </div>
    </div>
  );
}

export default function ProfileScreen({ role }) {
  const nav = NAVIGATION[role];
  const account = useAccount(role);
  const user = account.data?.user;
  const company = account.data?.company;
  const name = fullName(user);
  const status = company?.verification_status || "pending";
  const verification = VERIFICATION[status] || VERIFICATION.pending;
  const hasCertificate = Boolean(company?.certificate_file_url);

  const content = (
    <>
      {role === "fleet" ? (
        <FleetHeader
          eyebrow={nav.label}
          title="Business Profile"
          subtitle="Your ZamLine business account information."
        />
      ) : (
        <div className="mb-8">
          <PageHeader
            eyebrow={nav.label}
            title="Business Profile"
            description="Your ZamLine business account information."
          />
        </div>
      )}

      {account.loading && <ProfileSkeleton />}

      {!account.loading && account.error && (
        <div className="zl-alert is-error" role="alert">
          <Icon name="alert" />
          <span>
            <strong>We couldn&apos;t load your profile</strong>
            {account.error.message}
          </span>
        </div>
      )}

      {!account.loading && user && company && (
        <div className="profile-grid">
          <section
            className="zl-card profile-card"
            aria-labelledby="profile-name"
          >
            <div className="profile-head">
              <span className="zl-avatar is-lg" aria-hidden="true">
                {initials(name || company.business_name)}
              </span>
              <div className="profile-head-text">
                <h2 id="profile-name">{name || company.business_name}</h2>
                <p>{nav.accountLabel}</p>
              </div>
              <span className="zl-pill">View only</span>
            </div>

            <h3 className="profile-section-title">Business contacts</h3>
            <dl className="profile-details">
              <Detail label="Business name">{company.business_name}</Detail>
              <Detail label="Username">{name}</Detail>
              <Detail label="Business email">{company.company_email}</Detail>
              <Detail label="Login email">{user.email}</Detail>
              <Detail label="Business phone">{company.phone_number}</Detail>
              <Detail label="Registration number">
                {company.registration_number}
              </Detail>
            </dl>

            <p className="zl-alert is-info profile-note">
              <Icon name="info" />
              <span>
                Business contact details are used for verified freight
                coordination.
              </span>
            </p>
          </section>

          <section
            className="zl-card profile-card"
            aria-labelledby="verification-title"
          >
            <h2 id="verification-title" className="zl-card-title">
              Verification
            </h2>
            <div className={`profile-status is-${status}`}>
              <span className="profile-status-icon">
                <Icon name={verification.icon} size={20} />
              </span>
              <div>
                <strong>{verification.title}</strong>
                <p>
                  {company.verification_failure_reason || verification.text}
                </p>
              </div>
            </div>

            <div className="profile-certificate">
              <span className="profile-certificate-icon">
                <Icon name="file" />
              </span>
              <div>
                <strong>PACRA certificate</strong>
                <p>
                  {hasCertificate
                    ? "Certificate on file"
                    : "No certificate uploaded yet"}
                </p>
              </div>
              {hasCertificate && (
                <span className={`zl-badge is-${status}`}>
                  {verification.badge}
                </span>
              )}
            </div>

            {company.verified_at && (
              <p className="profile-meta">
                Verified on {formatDate(company.verified_at)}
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );

  if (role === "fleet") {
    return <FleetPage active="profile">{content}</FleetPage>;
  }

  return <ShipperPage>{content}</ShipperPage>;
}
