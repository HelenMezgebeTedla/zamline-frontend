"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as realApi from "../../lib/fleet/api";
import {
  COST_FIELDS,
  buildCostChanges,
  costSummary,
  fieldLabel,
  fleetAverage,
  formFromSettings,
  formatDate,
  validateCostField,
} from "../../lib/fleet/costSettings";
import { CheckCircleIcon, CheckIcon, LockIcon } from "./FleetIcons";
import "./FleetSetup.css";
import "./CostSettings.css";

function MoneyInput({ field, error, registration }) {
  const id = `cost-${field.key}`;
  return (
    <div className="cost-field">
      <label htmlFor={id}>{field.label}</label>
      <div className={`cost-input${error ? " has-error" : ""}`}>
        <input
          id={id}
          inputMode="decimal"
          {...registration}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : field.hint ? `${id}-hint` : undefined
          }
          placeholder="0.00"
        />
        <span className="cost-input__unit">{field.unit}</span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="cost-field__error">
          {error}
        </p>
      ) : field.hint ? (
        <p id={`${id}-hint`} className="cost-field__hint">
          {field.hint}
        </p>
      ) : null}
    </div>
  );
}

function FleetValue({ label, value, unit, count }) {
  return (
    <div className="cost-field">
      <span className="cost-field__label">{label}</span>
      <div className="cost-input cost-input--readonly">
        <span>{value ?? "—"}</span>
        <span className="cost-input__unit">{unit}</span>
      </div>
      <p className="cost-field__hint">
        {count
          ? `Average of your ${count} truck${count === 1 ? "" : "s"}. Set per truck in `
          : "Set per truck in "}
        <Link href="/fleet/fleet-setup" prefetch={false}>
          Fleet Setup
        </Link>
        .
      </p>
    </div>
  );
}

export default function CostSettings({ api = realApi }) {
  const router = useRouter();
  const [saved, setSaved] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [trucksError, setTrucksError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [pendingExtreme, setPendingExtreme] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: formFromSettings(null) });

  const registerAmount = (field) =>
    register(field.key, {
      validate: (value) => validateCostField(field, value),
      onChange: () => {
        setNotice(null);
        setPendingExtreme(null);
      },
    });

  const handleAuthError = useCallback(
    (error) => {
      if (error?.status === 401) {
        realApi.clearToken();
        router.replace("/fleet/login");
        return true;
      }
      return false;
    },
    [router],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getCostSettings(),
      api.listTrucks().then(
        (list) => ({ list }),
        (error) => ({ error }),
      ),
    ])
      .then(([settings, trucksResult]) => {
        if (!active) return;
        if (trucksResult.error?.status === 401) throw trucksResult.error;
        setSaved(settings);
        reset(formFromSettings(settings));
        setTrucks(trucksResult.list ?? []);
        setTrucksError(trucksResult.error?.message || "");
      })
      .catch((error) => {
        if (active && !handleAuthError(error)) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, handleAuthError, reset]);

  const savedForm = useMemo(
    () => (saved ? formFromSettings(saved) : null),
    [saved],
  );
  const summary = costSummary(saved, trucks);
  const activeTrucks = trucks.filter(
    (t) => t.availability_status !== "retired",
  ).length;

  function resetForm() {
    reset(savedForm);
    setNotice(null);
    setPendingExtreme(null);
  }

  async function send(changes, confirmExtreme) {
    setSaving(true);
    setNotice(null);
    try {
      const updated = await api.updateCostSettings(changes, confirmExtreme);
      setSaved(updated);
      reset(formFromSettings(updated));
      setPendingExtreme(null);
      setNotice({ type: "success", text: "Cost settings saved." });
    } catch (error) {
      if (handleAuthError(error)) return;
      const fields = error?.detail?.fields;
      if (error?.status === 422 && fields && !confirmExtreme) {
        setPendingExtreme({ changes, fields });
      } else {
        setNotice({ type: "error", text: error.message });
      }
    } finally {
      setSaving(false);
    }
  }

  function onValid(values) {
    const { changes } = buildCostChanges(savedForm, values);
    if (!Object.keys(changes).length) {
      setNotice({
        type: "success",
        text: "Nothing to save. Your cost settings are up to date.",
      });
      return;
    }
    send(changes, false);
  }

  function onInvalid() {
    setNotice({
      type: "error",
      text: "Check the highlighted amounts, then save again.",
    });
  }

  const fieldsIn = (section) =>
    COST_FIELDS.filter((f) => f.section === section);

  return (
    <div className="cost-page">
      <header className="cost-header">
        <div>
          <p className="eyebrow">Fleet Manager</p>
          <h1>Private Cost Settings</h1>
        </div>
        <span className="private-badge">
          <LockIcon size={14} /> Private to your company
        </span>
      </header>

      <div className="cost-layout">
        <form
          className="cost-card"
          onSubmit={handleSubmit(onValid, onInvalid)}
          noValidate
          aria-busy={loading}
        >
          {loading ? (
            <div role="status" className="cost-loading">
              <span className="visually-hidden">Loading cost settings…</span>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="skeleton"
                  style={{ height: 36, width: "60%" }}
                />
              ))}
            </div>
          ) : loadError ? (
            <p className="banner banner--error" role="alert">
              {loadError}
            </p>
          ) : !saved ? null : (
            <>
              <section className="cost-section" aria-labelledby="fuel-title">
                <h2 id="fuel-title">Fuel &amp; distance</h2>
                <FleetValue
                  label="Fuel consumption rate"
                  value={fleetAverage(trucks, "fuel_consumption_l_per_100km")}
                  unit="litres / 100 km"
                  count={activeTrucks}
                />
                {fieldsIn("fuel").map((f) => (
                  <MoneyInput
                    key={f.key}
                    field={f}
                    error={errors[f.key]?.message}
                    registration={registerAmount(f)}
                  />
                ))}
              </section>

              <section className="cost-section" aria-labelledby="driver-title">
                <h2 id="driver-title">Driver &amp; trip costs</h2>
                {fieldsIn("driver").map((f) => (
                  <MoneyInput
                    key={f.key}
                    field={f}
                    error={errors[f.key]?.message}
                    registration={registerAmount(f)}
                  />
                ))}
              </section>

              <section className="cost-section" aria-labelledby="vehicle-title">
                <h2 id="vehicle-title">Vehicle &amp; maintenance</h2>
                <FleetValue
                  label="Maintenance reserve"
                  value={fleetAverage(trucks, "maintenance_per_km")}
                  unit="ZMW / km"
                  count={activeTrucks}
                />
              </section>

              <section className="cost-section" aria-labelledby="other-title">
                <h2 id="other-title">Other costs</h2>
                {fieldsIn("other").map((f) => (
                  <MoneyInput
                    key={f.key}
                    field={f}
                    error={errors[f.key]?.message}
                    registration={registerAmount(f)}
                  />
                ))}
              </section>

              {pendingExtreme ? (
                <div className="extreme-box" role="alert">
                  <p className="extreme-box__title">
                    Some values look unusually high
                  </p>
                  <p>
                    Check{" "}
                    {Object.entries(pendingExtreme.fields)
                      .map(([name, { limit }]) =>
                        limit
                          ? `${fieldLabel(name)} (usual maximum ${limit})`
                          : fieldLabel(name),
                      )
                      .join(", ")}
                    . If they are right, save them anyway.
                  </p>
                  <div className="extreme-box__actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setPendingExtreme(null)}
                    >
                      Let me check
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => send(pendingExtreme.changes, true)}
                      disabled={saving}
                    >
                      Yes, save anyway
                    </button>
                  </div>
                </div>
              ) : null}

              {trucksError ? (
                <p className="banner banner--error" role="alert">
                  Could not load your trucks, so the fleet averages below are
                  not shown: {trucksError}
                </p>
              ) : null}
              {notice ? (
                <p
                  className={`banner banner--${notice.type}`}
                  role={notice.type === "error" ? "alert" : "status"}
                >
                  {notice.text}
                </p>
              ) : null}

              <div className="cost-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={resetForm}
                  disabled={!isDirty || saving}
                >
                  Reset changes
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--icon"
                  disabled={!isDirty || saving}
                >
                  {saving ? "Saving…" : "Save Cost Settings"}
                  {saving ? null : <CheckIcon size={14} />}
                </button>
              </div>
            </>
          )}
        </form>

        <aside className="cost-aside">
          <section
            className="cost-card cost-status"
            aria-labelledby="status-title"
          >
            <h2 id="status-title">Cost settings status</h2>
            <p
              className={`cost-status__state${summary.configured ? " is-ok" : ""}`}
            >
              {loading
                ? "Loading…"
                : summary.configured
                  ? "Configured"
                  : "Not configured"}
              {summary.configured ? <CheckCircleIcon size={18} /> : null}
            </p>
            <dl className="cost-status__list">
              <div>
                <dt>Active cost items</dt>
                <dd>{loading ? "—" : summary.activeItems}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDate(saved?.updated_at)}</dd>
              </div>
              <div>
                <dt>Used for</dt>
                <dd>Opportunity evaluation</dd>
              </div>
            </dl>
          </section>

          <section className="cost-card cost-help" aria-labelledby="help-title">
            <h2 id="help-title">How this helps</h2>
            <ol className="cost-steps">
              <li>
                <span>1</span>Compare route costs
              </li>
              <li>
                <span>2</span>Estimate trip viability
              </li>
              <li>
                <span>3</span>Prioritise suitable freight
              </li>
            </ol>
            <p className="cost-help__note">
              Cost values support your review decisions but never appear as
              public shipment information.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
