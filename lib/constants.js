export const BODY_TYPE_OPTIONS = [
  { value: "flatbed", label: "Flatbed" },
  { value: "box", label: "Box" },
  { value: "tanker", label: "Tanker" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "tipper", label: "Tipper" },
  { value: "container", label: "Container" },
];

export const CARGO_TYPE_OPTIONS = [
  "Copper cathodes",
  "Copper concentrate",
  "Maize",
  "Wheat",
  "Soya beans",
  "Fertiliser",
  "Cement",
  "Building materials",
  "Timber",
  "Machinery",
  "Packaged goods",
  "Beverages",
  "Steel products",
];

export const OTHER_CARGO = "__other__";

export const CARGO_TYPE_MAX_LENGTH = 20;
export const ADDRESS_MAX_LENGTH = 250;

export const STATUS_LABELS = {
  open: "Open",
  confirmed: "Accepted",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const WEIGHT_RANGES = [
  { value: "0-10000", label: "Up to 10,000 kg", min: 0, max: 10000 },
  { value: "10000-20000", label: "10,000 – 20,000 kg", min: 10000, max: 20000 },
  { value: "20000-30000", label: "20,000 – 30,000 kg", min: 20000, max: 30000 },
  { value: "30000-", label: "Over 30,000 kg", min: 30000, max: Infinity },
];
