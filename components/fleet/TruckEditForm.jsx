"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import {
  draftTruckType,
  formFromTruck,
  validatePositive,
} from "../../lib/fleet/savePlan";
import {
  BODY_TYPES,
  TRUCK_TYPES,
  cardForTruckType,
} from "../../lib/fleet/truckTypes";
import AvailabilityPill from "./AvailabilityPill";
import Field from "./Field";

const ERROR_ORDER = [
  "customType",
  "capacity",
  "fuel",
  "maintenance",
  "location",
];

export function firstFormError(errors) {
  for (const name of ERROR_ORDER) {
    if (errors[name]?.message) return errors[name].message;
  }
  return "Check the highlighted fields, then save again.";
}

export default function TruckEditForm({
  truck,
  allocated,
  busy,
  onSubmit,
  onInvalid,
  onCancel,
}) {
  const defaults = formFromTruck(truck, cardForTruckType);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ defaultValues: defaults });
  const cardId = useWatch({ control, name: "cardId" });

  function submit(values) {
    const present = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined),
    );
    onSubmit({ ...defaults, ...present });
  }

  return (
    <form
      className="edit-form"
      onSubmit={handleSubmit(submit, onInvalid)}
      noValidate
    >
      <Field id="edit-type" label="Truck type">
        <select id="edit-type" className="field" {...register("cardId")}>
          {TRUCK_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      {cardId === "other" ? (
        <Field
          id="edit-custom"
          label="Name this truck type"
          error={errors.customType?.message}
        >
          <input
            id="edit-custom"
            className="field"
            maxLength={30}
            aria-invalid={errors.customType ? true : undefined}
            {...register("customType", {
              validate: (value) => {
                const name = draftTruckType({ cardId, customType: value });
                return (
                  (name.length >= 2 && name.length <= 30) ||
                  "Truck type must be 2 to 30 characters"
                );
              },
            })}
          />
        </Field>
      ) : null}
      <Field
        id="edit-body"
        label="Body type"
        hint={allocated ? "Locked while on a confirmed shipment" : null}
      >
        <select
          id="edit-body"
          className="field"
          disabled={allocated}
          {...register("bodyType")}
        >
          {BODY_TYPES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="edit-capacity"
        label="Carrying capacity (kg)"
        hint={allocated ? "Locked while on a confirmed shipment" : null}
        error={errors.capacity?.message}
      >
        <input
          id="edit-capacity"
          className="field"
          inputMode="decimal"
          disabled={allocated}
          aria-invalid={errors.capacity ? true : undefined}
          {...register("capacity", {
            validate: (value) => validatePositive(value, "Carrying capacity"),
          })}
        />
      </Field>
      <Field
        id="edit-fuel"
        label="Fuel use (L/100 km)"
        error={errors.fuel?.message}
      >
        <input
          id="edit-fuel"
          className="field"
          inputMode="decimal"
          aria-invalid={errors.fuel ? true : undefined}
          {...register("fuel", {
            validate: (value) => validatePositive(value, "Fuel consumption"),
          })}
        />
      </Field>
      <Field
        id="edit-maintenance"
        label="Maintenance (ZMW/km)"
        error={errors.maintenance?.message}
      >
        <input
          id="edit-maintenance"
          className="field"
          inputMode="decimal"
          aria-invalid={errors.maintenance ? true : undefined}
          {...register("maintenance", {
            validate: (value) => validatePositive(value, "Maintenance cost"),
          })}
        />
      </Field>
      <Field
        id="edit-location"
        label="Current location"
        error={errors.location?.message}
      >
        <input
          id="edit-location"
          className="field"
          maxLength={50}
          aria-invalid={errors.location ? true : undefined}
          {...register("location", {
            validate: (value) =>
              value.trim().length <= 50 ||
              "Location must be 50 characters or fewer",
          })}
        />
      </Field>
      <div className="edit-field">
        <span className="edit-label">Availability</span>
        <Controller
          name="availability"
          control={control}
          render={({ field }) => (
            <AvailabilityPill
              status={field.value}
              locked={allocated}
              onChange={field.onChange}
              label={truck.plate_number}
            />
          )}
        />
      </div>

      <p className="details-note">The plate number can&apos;t be changed.</p>
      <div className="details-actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
