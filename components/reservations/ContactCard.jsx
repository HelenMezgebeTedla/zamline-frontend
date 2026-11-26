"use client";

import Icon from "@/components/ui/Icon";
import { useLoad } from "@/hooks/useLoad";
import { getContact } from "@/lib/reservations";

const HIDDEN_TEXT = {
  fleet:
    "The shipper's phone number and email unlock as soon as you book this load.",
  shipper:
    "The fleet company's phone number and email unlock once they book this shipment.",
};

export default function ContactCard({
  role,
  shipmentId,
  version = 0,
  cancelled = false,
}) {
  const contact = useLoad(role, `contact:${shipmentId}:${version}`, () =>
    getContact(shipmentId),
  );
  const data = contact.data;

  if (contact.loading) {
    return (
      <section
        className="zl-card res-contact"
        aria-busy="true"
        aria-label="Loading contact"
      >
        <div className="zl-skeleton res-contact-skeleton" />
        <div className="zl-skeleton" />
        <div className="zl-skeleton" />
      </section>
    );
  }

  if (contact.error) {
    const message =
      contact.error.status === 404
        ? "You don't have access to this shipment's contact details."
        : contact.error.message;
    return (
      <section className="zl-card res-contact">
        <p className="zl-eyebrow">Business contact</p>
        <p className="res-muted">{message}</p>
      </section>
    );
  }

  if (!data?.visible) {
    return (
      <section className="zl-card res-contact is-locked" aria-live="polite">
        <div className="res-contact-head">
          <p className="zl-eyebrow">Business contact hidden</p>
          <span className="res-contact-badge">
            <Icon name="lock" size={18} />
          </span>
        </div>
        <p className="res-contact-locked">
          {cancelled
            ? "This booking was cancelled, so contact details are hidden again."
            : HIDDEN_TEXT[role]}
        </p>
      </section>
    );
  }

  return (
    <section className="zl-card res-contact" aria-live="polite">
      <div className="res-contact-head">
        <p className="zl-eyebrow">Business contact available</p>
        <span className="res-contact-badge">
          <Icon name="building" size={18} />
        </span>
      </div>
      <h2 className="res-contact-name">{data.business_name}</h2>
      <ul className="res-contact-lines">
        <li>
          <Icon name="phone" size={15} />
          <a href={`tel:${data.phone_number}`}>{data.phone_number}</a>
        </li>
        <li>
          <Icon name="mail" size={15} />
          <a href={`mailto:${data.company_email}`}>{data.company_email}</a>
        </li>
      </ul>
      <a
        className="zl-button is-cyan res-contact-button"
        href={`mailto:${data.company_email}`}
      >
        Contact business
      </a>
    </section>
  );
}
