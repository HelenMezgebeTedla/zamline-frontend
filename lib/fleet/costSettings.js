export const COST_FIELDS = [
  {
    key: "fuel_price_per_litre",
    label: "Fuel price per litre",
    unit: "ZMW / litre",
    section: "fuel",
    required: true,
  },
  {
    key: "driver_daily_allowance",
    label: "Driver allowance",
    unit: "ZMW / day",
    section: "driver",
  },
  {
    key: "toll_assumption",
    label: "Tolls and road fees",
    unit: "ZMW / trip",
    section: "driver",
  },
  {
    key: "other_costs",
    label: "Other costs",
    unit: "ZMW / trip",
    section: "other",
    hint: "Parking, permits, loading fees and anything else per trip.",
  },
];

function clean(text) {
  return String(text ?? "")
    .replace(/,/g, "")
    .trim();
}

export function formFromSettings(settings) {
  const form = {};
  for (const { key } of COST_FIELDS) {
    const value = settings?.[key];
    form[key] = value === null || value === undefined ? "" : String(value);
  }
  return form;
}

// Used as a React Hook Form `validate` rule. Returns true when the text is
// acceptable, otherwise the message to show.
export function validateCostField(field, value) {
  const text = clean(value);
  if (text === "") return field.required ? `${field.label} is required` : true;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return "Enter an amount like 28.50 (up to 2 decimal places)";
  }
  if (field.required && Number(text) <= 0) {
    return `${field.label} must be greater than 0`;
  }
  return true;
}

export function buildCostChanges(saved, form) {
  const changes = {};
  const errors = {};

  for (const field of COST_FIELDS) {
    const valid = validateCostField(field, form[field.key]);
    if (valid !== true) {
      errors[field.key] = valid;
      continue;
    }

    const text = clean(form[field.key]);
    const before = clean(saved[field.key]);
    if (text === "") {
      if (before !== "") changes[field.key] = null;
    } else if (before === "" || Number(before) !== Number(text)) {
      changes[field.key] = Number(text).toFixed(2);
    }
  }
  return { changes, errors };
}

export function fieldLabel(key) {
  return COST_FIELDS.find((f) => f.key === key)?.label || key;
}

export function costSummary(settings, trucks = []) {
  const filled = COST_FIELDS.filter((f) => {
    const v = settings?.[f.key];
    return v !== null && v !== undefined && v !== "";
  }).length;
  const active = trucks.filter((t) => t.availability_status !== "retired");
  const perTruck = active.length ? 2 * active.length : 0;
  return {
    configured: Boolean(settings?.fuel_price_per_litre),
    activeItems: filled + perTruck,
  };
}

export function fleetAverage(trucks, key) {
  const values = trucks
    .filter((t) => t.availability_status !== "retired")
    .map((t) => Number(t[key]))
    .filter((n) => Number.isFinite(n));
  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 100) / 100;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
