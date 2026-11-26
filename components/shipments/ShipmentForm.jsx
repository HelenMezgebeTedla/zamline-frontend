"use client";

import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { toError } from "@/lib/http";
import {
  ADDRESS_MAX_LENGTH,
  BODY_TYPE_OPTIONS,
  CARGO_TYPE_MAX_LENGTH,
  CARGO_TYPE_OPTIONS,
  OTHER_CARGO,
} from "@/lib/constants";
import { isFuturePickup, toDateInput, toTimeInput } from "@/lib/format";

const SERVER_FIELD_MAP = {
  origin_address: "origin_address",
  destination_address: "destination_address",
  cargo_type: "cargo_choice",
  weight_kg: "weight_kg",
  required_body_type: "required_body_type",
  pickup_date: "pickup_date",
  pickup_time: "pickup_time",
  proposed_amount: "proposed_amount",
  special_requirements: "special_requirements",
};

function defaultsFrom(shipment) {
  if (!shipment) {
    return {
      origin_address: "",
      destination_address: "",
      cargo_choice: "",
      cargo_other: "",
      required_body_type: "",
      pickup_date: "",
      pickup_time: "",
      special_requirements: "",
    };
  }
  const known = CARGO_TYPE_OPTIONS.includes(shipment.cargo_type);
  return {
    origin_address: shipment.origin_address,
    destination_address: shipment.destination_address,
    cargo_choice: known ? shipment.cargo_type : OTHER_CARGO,
    cargo_other: known ? "" : shipment.cargo_type,
    weight_kg: shipment.weight_kg,
    required_body_type: shipment.required_body_type,
    pickup_date: toDateInput(shipment.pickup_time),
    pickup_time: toTimeInput(shipment.pickup_time),
    proposed_amount: Number(shipment.proposed_amount),
    special_requirements: shipment.special_requirements ?? "",
  };
}

function cargoFrom(values) {
  return values.cargo_choice === OTHER_CARGO
    ? values.cargo_other.trim()
    : values.cargo_choice;
}

function toCreatePayload(values) {
  return {
    origin_address: values.origin_address.trim(),
    destination_address: values.destination_address.trim(),
    cargo_type: cargoFrom(values),
    weight_kg: values.weight_kg,
    required_body_type: values.required_body_type,
    pickup_date: values.pickup_date,
    pickup_time: values.pickup_time,
    proposed_amount: values.proposed_amount,
    special_requirements: values.special_requirements.trim() || null,
  };
}

function messageFieldFor(error) {
  const message = error.message.toLowerCase();
  if (message.startsWith("origin address")) return "origin_address";
  if (message.startsWith("destination address")) return "destination_address";
  if (message.includes("pickup")) return "pickup_time";
  if (message.includes("cargo type")) return "cargo_choice";
  return null;
}

export function ShipmentForm(props) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm({
    mode: "onTouched",
    defaultValues: defaultsFrom(props.shipment),
  });

  const cargoChoice = useWatch({ control, name: "cargo_choice" });

  function describedBy(name) {
    return errors[name] ? `${name}-message` : undefined;
  }

  async function submit(values) {
    try {
      if (props.mode === "create") {
        await props.onSubmit(toCreatePayload(values));
        return;
      }
      const full = toCreatePayload(values);
      const changes = {};
      if (dirtyFields.origin_address)
        changes.origin_address = full.origin_address;
      if (dirtyFields.destination_address)
        changes.destination_address = full.destination_address;
      if (dirtyFields.cargo_choice || dirtyFields.cargo_other)
        changes.cargo_type = full.cargo_type;
      if (dirtyFields.weight_kg) changes.weight_kg = full.weight_kg;
      if (dirtyFields.required_body_type)
        changes.required_body_type = full.required_body_type;
      if (dirtyFields.pickup_date || dirtyFields.pickup_time) {
        changes.pickup_date = full.pickup_date;
        changes.pickup_time = full.pickup_time;
      }
      if (dirtyFields.proposed_amount)
        changes.proposed_amount = full.proposed_amount;
      if (dirtyFields.special_requirements)
        changes.special_requirements = full.special_requirements;
      await props.onSubmit(changes);
    } catch (caught) {
      const error = toError(caught);
      let mapped = false;
      for (const [serverField, message] of Object.entries(error.fieldErrors)) {
        const field = SERVER_FIELD_MAP[serverField];
        if (!field) continue;
        const target =
          field === "cargo_choice" && values.cargo_choice === OTHER_CARGO
            ? "cargo_other"
            : field;
        setError(target, { type: "server", message }, { shouldFocus: !mapped });
        mapped = true;
      }
      const messageField = mapped ? null : messageFieldFor(error);
      if (messageField && (error.status === 400 || error.status === 422)) {
        const target =
          messageField === "cargo_choice" && values.cargo_choice === OTHER_CARGO
            ? "cargo_other"
            : messageField;
        setError(
          target,
          { type: "server", message: error.message },
          { shouldFocus: true },
        );
        return;
      }
      setError("root.server", {
        type: String(error.status),
        message: error.message,
      });
    }
  }

  const isEdit = props.mode === "edit";

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-8">
      {errors.root?.server ? (
        <Alert
          tone="error"
          title={
            isEdit
              ? "We couldn't save your changes"
              : "We couldn't post this shipment"
          }
        >
          {errors.root.server.message}
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-slate-200">
        <fieldset className="space-y-5 lg:pr-10">
          <legend className="text-base font-semibold text-navy-950">
            Route and cargo
          </legend>

          <Field
            id="origin_address"
            label="Origin"
            error={errors.origin_address?.message}
            hint="Town, area or street where the cargo will be collected."
          >
            <Input
              id="origin_address"
              placeholder="e.g. Kitwe"
              autoComplete="off"
              aria-invalid={errors.origin_address ? true : undefined}
              aria-describedby="origin_address-message"
              {...register("origin_address", {
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed)
                    return "Enter where the cargo will be collected";
                  if (trimmed.length < 2) return "Enter at least 2 characters";
                  if (trimmed.length > ADDRESS_MAX_LENGTH)
                    return `Keep it under ${ADDRESS_MAX_LENGTH} characters`;
                  return true;
                },
              })}
            />
          </Field>

          <Field
            id="destination_address"
            label="Destination"
            error={errors.destination_address?.message}
            hint="Town, area or street where the cargo will be delivered."
          >
            <Input
              id="destination_address"
              placeholder="e.g. Lusaka"
              autoComplete="off"
              aria-invalid={errors.destination_address ? true : undefined}
              aria-describedby="destination_address-message"
              {...register("destination_address", {
                validate: (value, values) => {
                  const trimmed = value.trim();
                  if (!trimmed)
                    return "Enter where the cargo will be delivered";
                  if (trimmed.length < 2) return "Enter at least 2 characters";
                  if (trimmed.length > ADDRESS_MAX_LENGTH)
                    return `Keep it under ${ADDRESS_MAX_LENGTH} characters`;
                  if (
                    trimmed.toLowerCase() ===
                    values.origin_address.trim().toLowerCase()
                  ) {
                    return "Destination must be different from the origin";
                  }
                  return true;
                },
              })}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="cargo_choice"
              label="Cargo type"
              error={errors.cargo_choice?.message}
            >
              <Select
                id="cargo_choice"
                aria-invalid={errors.cargo_choice ? true : undefined}
                aria-describedby={describedBy("cargo_choice")}
                {...register("cargo_choice", {
                  required: "Choose the type of cargo",
                })}
              >
                <option value="" disabled>
                  Select cargo
                </option>
                {CARGO_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={OTHER_CARGO}>Other</option>
              </Select>
            </Field>

            <Field
              id="required_body_type"
              label="Required truck body"
              error={errors.required_body_type?.message}
            >
              <Select
                id="required_body_type"
                aria-invalid={errors.required_body_type ? true : undefined}
                aria-describedby={describedBy("required_body_type")}
                {...register("required_body_type", {
                  required: "Choose the truck body you need",
                })}
              >
                <option value="" disabled>
                  Select body type
                </option>
                {BODY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {cargoChoice === OTHER_CARGO ? (
            <Field
              id="cargo_other"
              label="Describe the cargo"
              error={errors.cargo_other?.message}
              hint={`Up to ${CARGO_TYPE_MAX_LENGTH} characters.`}
            >
              <Input
                id="cargo_other"
                placeholder="e.g. Solar panels"
                maxLength={CARGO_TYPE_MAX_LENGTH}
                aria-invalid={errors.cargo_other ? true : undefined}
                aria-describedby="cargo_other-message"
                {...register("cargo_other", {
                  shouldUnregister: true,
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) return "Describe the cargo";
                    if (trimmed.length < 2)
                      return "Enter at least 2 characters";
                    if (trimmed.length > CARGO_TYPE_MAX_LENGTH)
                      return `Keep it under ${CARGO_TYPE_MAX_LENGTH} characters`;
                    return true;
                  },
                })}
              />
            </Field>
          ) : null}

          <Field
            id="weight_kg"
            label="Cargo weight"
            error={errors.weight_kg?.message}
          >
            <Input
              id="weight_kg"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              placeholder="18000"
              trailing="kg"
              aria-invalid={errors.weight_kg ? true : undefined}
              aria-describedby={describedBy("weight_kg")}
              {...register("weight_kg", {
                valueAsNumber: true,
                validate: (value) => {
                  if (!Number.isFinite(value)) return "Enter the cargo weight";
                  if (value <= 0) return "Weight must be more than 0 kg";
                  return true;
                },
              })}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-5 lg:pl-10">
          <legend className="text-base font-semibold text-navy-950">
            Pickup and payment
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="pickup_date"
              label="Pickup date"
              error={errors.pickup_date?.message}
            >
              <Input
                id="pickup_date"
                type="date"
                aria-invalid={errors.pickup_date ? true : undefined}
                aria-describedby={describedBy("pickup_date")}
                {...register("pickup_date", {
                  required: "Choose a pickup date",
                })}
              />
            </Field>

            <Field
              id="pickup_time"
              label="Preferred pickup time"
              error={errors.pickup_time?.message}
              hint="Zambia time (CAT)."
            >
              <Input
                id="pickup_time"
                type="time"
                aria-invalid={errors.pickup_time ? true : undefined}
                aria-describedby="pickup_time-message"
                {...register("pickup_time", {
                  required: "Choose a pickup time",
                  deps: ["pickup_date"],
                  validate: (value, values) =>
                    !values.pickup_date ||
                    isFuturePickup(values.pickup_date, value) ||
                    "Pickup date and time must be in the future",
                })}
              />
            </Field>
          </div>

          <Field
            id="proposed_amount"
            label="Proposed payment"
            error={errors.proposed_amount?.message}
          >
            <Input
              id="proposed_amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.01"
              placeholder="18500"
              leading="ZMW"
              aria-invalid={errors.proposed_amount ? true : undefined}
              aria-describedby={describedBy("proposed_amount")}
              {...register("proposed_amount", {
                valueAsNumber: true,
                validate: (value) => {
                  if (!Number.isFinite(value))
                    return "Enter how much you will pay";
                  if (value <= 0) return "Payment must be more than ZMW 0";
                  return true;
                },
              })}
            />
          </Field>

          <Field
            id="special_requirements"
            label="Notes"
            optional
            hint="Handling, permits or delivery instructions for the fleet manager."
          >
            <Textarea
              id="special_requirements"
              placeholder="Add handling or delivery notes"
              aria-describedby="special_requirements-message"
              {...register("special_requirements")}
            />
          </Field>
        </fieldset>
      </div>

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        {props.onCancel ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={props.onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isEdit && !isDirty}
          className="w-full max-w-full"
        >
          {isSubmitting
            ? isEdit
              ? "Saving…"
              : "Posting…"
            : isEdit
              ? "Save changes"
              : "Post shipment"}
        </Button>
      </div>
    </form>
  );
}
