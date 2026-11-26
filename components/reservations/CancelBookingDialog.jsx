"use client";

import { useState } from "react";
import Dialog from "@/components/ui/Dialog";
import Icon from "@/components/ui/Icon";
import { CANCEL_REASON_LIMIT } from "@/lib/reservations";

export default function CancelBookingDialog({
  open,
  busy,
  error,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      icon="alert"
      tone="danger"
      title="Cancel this booking?"
      description="The shipment will be marked as cancelled and both companies' contact details will be hidden again. This can't be undone."
      busy={busy}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="zl-button is-outline"
            onClick={onClose}
            disabled={busy}
          >
            Keep booking
          </button>

          <button
            type="button"
            className="zl-button is-danger"
            onClick={() => onConfirm(reason)}
            disabled={busy}
          >
            {busy ? "Cancelling…" : "Cancel booking"}
          </button>
        </>
      }
    >
      <label className="res-reason-label" htmlFor="cancel-reason">
        Reason <span>(optional)</span>
      </label>

      <textarea
        id="cancel-reason"
        className="res-reason"
        rows={3}
        maxLength={CANCEL_REASON_LIMIT}
        placeholder="For example: the truck broke down"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        aria-describedby="cancel-count"
      />

      <p id="cancel-count" className="res-reason-count">
        {reason.length} / {CANCEL_REASON_LIMIT}
      </p>

      {error && (
        <div className="zl-alert is-error" role="alert">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}
    </Dialog>
  );
}
