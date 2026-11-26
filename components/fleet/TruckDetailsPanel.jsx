"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { buildTruckChanges, formatCapacity } from "../../lib/fleet/savePlan";
import { bodyTypeLabel, cardForTruckType } from "../../lib/fleet/truckTypes";
import Field from "./Field";
import TruckEditForm, { firstFormError } from "./TruckEditForm";
import { CloseIcon, TrashIcon, TruckIcon } from "./FleetIcons";
import { TruckDetailsSkeleton } from "./FleetSkeletons";
import "./TruckDetailsPanel.css";

const STATUS_LABEL = {
  available: "Available",
  unavailable: "Unavailable",
  retired: "Retired",
  allocated: "Allocated",
};

function Detail({ label, value }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

export default function TruckDetailsPanel({
  truckId,
  api,
  onClose,
  onAuthError,
  onChanged,
}) {
  const [truck, setTruck] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [allocationError, setAllocationError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [mode, setMode] = useState("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const closeButton = useRef(null);
  const panel = useRef(null);
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getTruck(truckId),
      api.getTruckAllocation(truckId).then(
        (data) => ({ data }),
        (error) => ({ error }),
      ),
    ])
      .then(([truckData, result]) => {
        if (!active) return;
        if (result.error?.status === 401) throw result.error;
        setTruck(truckData);
        setAllocation(result.data ?? null);
        setAllocationError(
          result.error
            ? result.error.message || "Could not load allocation status."
            : "",
        );
      })
      .catch((err) => {
        if (!active) return;
        if (onAuthError?.(err)) return;
        setLoadError(err.message);
      });
    return () => {
      active = false;
    };
  }, [truckId, api, onAuthError]);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  useEffect(() => {
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function trap(e) {
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (!items.length) {
        e.preventDefault();
        panel.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!panel.current.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [opener]);

  const allocated = allocation?.allocation_status === "allocated";
  const allocationUnknown = !allocation;

  async function retryAllocation() {
    setRetrying(true);
    try {
      setAllocation(await api.getTruckAllocation(truckId));
      setAllocationError("");
    } catch (err) {
      if (!onAuthError?.(err)) {
        setAllocationError(err.message || "Could not load allocation status.");
      }
    } finally {
      setRetrying(false);
    }
  }
  const card = truck ? cardForTruckType(truck.truck_type) : null;
  const status = allocated ? "allocated" : truck?.availability_status;

  function failed(err) {
    if (onAuthError?.(err)) return;
    setMessage({ type: "error", text: err.message });
  }

  function startEdit() {
    setMessage(null);
    setMode("edit");
  }

  function backToView() {
    setMode("view");
    setReason("");
    setMessage(null);
  }

  function editInvalid(errors) {
    setMessage({ type: "error", text: firstFormError(errors) });
  }

  async function saveEdit(values) {
    const { changes, availability, error } = buildTruckChanges(truck, values);
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }
    if (!changes && !availability) {
      backToView();
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      let updated = truck;
      if (changes) updated = await api.updateTruck(truck.truck_id, changes);
      if (availability) {
        updated = await api.updateAvailability(truck.truck_id, availability);
      }
      setTruck(updated);
      setMode("view");
      setMessage({ type: "success", text: "Truck details updated." });
      onChanged?.(`${updated.plate_number} updated.`);
    } catch (err) {
      failed(err);
    } finally {
      setBusy(false);
    }
  }

  async function confirmRetire() {
    setBusy(true);
    setMessage(null);
    try {
      await api.retireTruck(truck.truck_id, reason.trim() || undefined);
      onChanged?.(`${truck.plate_number} has been retired.`);
      onClose();
    } catch (err) {
      failed(err);
      setBusy(false);
    }
  }

  return (
    <div className="details-backdrop" onClick={() => !busy && onClose()}>
      <aside
        ref={panel}
        tabIndex={-1}
        className="details-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="truck-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="details-head">
          <p className="details-eyebrow">
            {mode === "edit" ? "Edit truck" : "Truck details"}
          </p>
          <button
            ref={closeButton}
            type="button"
            className="details-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close truck details"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {loadError ? (
          <p className="banner banner--error" role="alert">
            {loadError}
          </p>
        ) : !truck ? (
          <TruckDetailsSkeleton />
        ) : (
          <>
            <div className="details-hero">
              <div className="details-image">
                {card?.image ? (
                  <Image src={card.image} alt="" width={164} height={80} />
                ) : (
                  <TruckIcon size={36} />
                )}
              </div>
              <div>
                <h2 id="truck-details-title">{truck.plate_number}</h2>
                <p className="details-type">{truck.truck_type}</p>
                <span className={`status-chip status-chip--${status}`}>
                  {STATUS_LABEL[status] || status}
                </span>
              </div>
            </div>

            {allocationError && allocationUnknown ? (
              <p className="banner banner--error" role="alert">
                Could not check whether this truck is on a confirmed shipment:{" "}
                {allocationError}. Editing and retiring are turned off until
                this loads.{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={retryAllocation}
                  disabled={retrying}
                >
                  {retrying ? "Trying again…" : "Try again"}
                </button>
              </p>
            ) : null}

            {message ? (
              <p
                className={`banner banner--${message.type}`}
                role={message.type === "error" ? "alert" : "status"}
              >
                {message.text}
              </p>
            ) : null}

            {mode === "edit" ? (
              <TruckEditForm
                truck={truck}
                allocated={allocated}
                busy={busy}
                onSubmit={saveEdit}
                onInvalid={editInvalid}
                onCancel={backToView}
              />
            ) : mode === "retire" ? (
              <section className="retire-box" aria-labelledby="retire-title">
                <h3 id="retire-title">Retire {truck.plate_number}?</h3>
                <p>
                  It stays in your records but won&apos;t be matched to freight
                  again. This can&apos;t be undone from here.
                </p>
                <Field id="retire-reason" label="Reason (optional)">
                  <input
                    id="retire-reason"
                    className="field"
                    maxLength={255}
                    placeholder="e.g. Sold"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
                <div className="details-actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={backToView}
                    disabled={busy}
                  >
                    Keep truck
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={confirmRetire}
                    disabled={busy}
                  >
                    {busy ? "Retiring…" : "Retire truck"}
                  </button>
                </div>
              </section>
            ) : (
              <>
                <section aria-labelledby="specs-title">
                  <h3 id="specs-title">Specifications</h3>
                  <dl className="details-grid">
                    <Detail label="Plate number" value={truck.plate_number} />
                    <Detail label="Truck type" value={truck.truck_type} />
                    <Detail
                      label="Body type"
                      value={bodyTypeLabel(truck.body_type)}
                    />
                    <Detail
                      label="Carrying capacity"
                      value={`${formatCapacity(truck.capacity_kg)} kg`}
                    />
                    <Detail
                      label="Fuel consumption"
                      value={`${formatCapacity(truck.fuel_consumption_l_per_100km)} L / 100 km`}
                    />
                    <Detail
                      label="Maintenance cost"
                      value={`ZMW ${Number(truck.maintenance_per_km).toFixed(2)} / km`}
                    />
                    <Detail
                      label="Current location"
                      value={truck.current_location || null}
                    />
                  </dl>
                </section>

                <p className="details-note">
                  The plate number can&apos;t be changed.
                  {allocated
                    ? " This truck is on a confirmed shipment, so it can't be retired."
                    : ""}
                </p>
                <div className="details-actions">
                  <button
                    type="button"
                    className="btn btn--danger-outline"
                    onClick={() => {
                      setMessage(null);
                      setMode("retire");
                    }}
                    disabled={allocated || allocationUnknown}
                  >
                    <TrashIcon size={14} /> Retire
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={startEdit}
                    disabled={allocationUnknown}
                  >
                    Edit details
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
