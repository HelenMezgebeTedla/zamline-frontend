export const BODY_TYPES = [
  { value: "flatbed", label: "Flatbed" },
  { value: "box", label: "Box / enclosed" },
  { value: "tanker", label: "Tanker" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "tipper", label: "Tipper" },
  { value: "container", label: "Container" },
];

export const TRUCK_TYPES = [
  {
    id: "container",
    name: "Container Carrier",
    description: "Port and container freight.",
    image: "/image/container-carrier.jpg",
    bodyType: "container",
  },
  {
    id: "curtain-side",
    name: "Curtain-side",
    description: "Palletised goods with side access.",
    image: "/image/curtain-side.jpg",
    bodyType: "box",
  },
  {
    id: "box",
    name: "Box / Enclosed Truck",
    description: "Enclosed general cargo.",
    image: "/image/box.jpg",
    bodyType: "box",
  },
  {
    id: "refrigerated",
    name: "Refrigerated / Reefer",
    description: "Temperature-sensitive goods.",
    image: "/image/reefer.jpg",
    bodyType: "refrigerated",
  },
  {
    id: "flatbed",
    name: "Flatbed Truck",
    description: "Machinery, steel and oversized loads.",
    image: "/image/flatbed.jpg",
    bodyType: "flatbed",
  },
  {
    id: "tipper",
    name: "Tipper Truck",
    description: "Sand, gravel, ore and bulk loads.",
    image: "/image/tipper.jpg",
    bodyType: "tipper",
  },
  {
    id: "rigid",
    name: "Rigid Truck",
    description: "Urban and regional delivery.",
    image: "/image/rigid.png",
    bodyType: "box",
  },
  {
    id: "other",
    name: "Other",
    description: "Another truck or trailer type.",
    image: null,
    bodyType: "flatbed",
  },
];

const byName = new Map(
  TRUCK_TYPES.filter((t) => t.id !== "other").map((t) => [
    t.name.toLowerCase(),
    t,
  ]),
);

export function cardForTruckType(truckType) {
  const key = String(truckType || "")
    .trim()
    .toLowerCase();
  return byName.get(key) || TRUCK_TYPES.find((t) => t.id === "other");
}

export function getCard(id) {
  return TRUCK_TYPES.find((t) => t.id === id);
}

export function bodyTypeLabel(value) {
  return BODY_TYPES.find((b) => b.value === value)?.label || value;
}
