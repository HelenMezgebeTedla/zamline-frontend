import { getCard } from "./truckTypes";

export function normalizePlate(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function formatCapacity(kg) {
  if (kg === null || kg === undefined || kg === "") return "";
  const n = Number(kg);
  if (!Number.isFinite(n)) return String(kg);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function parseNumber(text) {
  const cleaned = String(text ?? "")
    .replace(/,/g, "")
    .replace(/kg/i, "")
    .trim();
  if (cleaned === "") return NaN;
  return Number(cleaned);
}

function positive(text, label) {
  const n = parseNumber(text);
  if (!Number.isFinite(n) || n <= 0)
    return { error: `${label} must be greater than 0` };
  return { value: n };
}

export function validatePositive(text, label) {
  const result = positive(text, label);
  return result.error ?? true;
}

export function emptyDraft(cardId, key) {
  const card = getCard(cardId) || getCard("other");
  return {
    key,
    cardId: card.id,
    customType: "",
    plate: "",
    bodyType: card.bodyType,
    capacity: "",
    fuel: "",
    maintenance: "",
    location: "",
    availability: "available",
    error: null,
  };
}

export function draftTruckType(draft) {
  if (draft.cardId === "other") return draft.customType.trim();
  return getCard(draft.cardId)?.name || "";
}

export function validateDraft(draft) {
  const plate = normalizePlate(draft.plate);
  if (plate.length < 2 || plate.length > 20) {
    return { error: "Plate number must be 2 to 20 characters" };
  }
  const truckType = draftTruckType(draft);
  if (truckType.length < 2 || truckType.length > 30) {
    return { error: "Truck type must be 2 to 30 characters" };
  }
  if (!draft.bodyType) return { error: "Choose a body type" };

  const capacity = positive(draft.capacity, "Carrying capacity");
  if (capacity.error) return capacity;
  const fuel = positive(draft.fuel, "Fuel consumption");
  if (fuel.error) return fuel;
  const maintenance = positive(draft.maintenance, "Maintenance cost");
  if (maintenance.error) return maintenance;

  const location = draft.location.trim();
  if (location.length > 50)
    return { error: "Location must be 50 characters or fewer" };

  const payload = {
    plate_number: plate,
    truck_type: truckType,
    body_type: draft.bodyType,
    capacity_kg: capacity.value,
    fuel_consumption_l_per_100km: fuel.value,
    maintenance_per_km: String(maintenance.value),
  };
  if (location) payload.current_location = location;
  return { payload };
}

export function buildSavePlan(trucks, edits, removed, drafts) {
  const ops = [];
  const errors = {};

  for (const truck of trucks) {
    const id = truck.truck_id;
    if (removed.has(id)) {
      ops.push({ kind: "retire", truck });
      continue;
    }
    const edit = edits[id];
    if (!edit) continue;

    if (edit.capacity !== undefined) {
      const capacity = parseNumber(edit.capacity);
      if (!Number.isFinite(capacity) || capacity <= 0) {
        errors[id] = "Carrying capacity must be greater than 0";
      } else if (capacity !== Number(truck.capacity_kg)) {
        ops.push({ kind: "update", truck, changes: { capacity_kg: capacity } });
      }
    }
    if (edit.availability && edit.availability !== truck.availability_status) {
      ops.push({ kind: "availability", truck, status: edit.availability });
    }
  }

  for (const draft of drafts) {
    const { payload, error } = validateDraft(draft);
    if (error) errors[draft.key] = error;
    else
      ops.push({
        kind: "create",
        draft,
        payload,
        availability: draft.availability,
      });
  }

  return { ops, errors };
}

export async function runSavePlan(ops, api) {
  const results = [];
  for (const op of ops) {
    try {
      if (op.kind === "retire") {
        await api.retireTruck(op.truck.truck_id);
      } else if (op.kind === "update") {
        await api.updateTruck(op.truck.truck_id, op.changes);
      } else if (op.kind === "availability") {
        await api.updateAvailability(op.truck.truck_id, op.status);
      } else if (op.kind === "create") {
        const created = await api.createTruck(op.payload);
        results.push({ op, ok: true, created });
        if (op.availability === "unavailable") {
          const followUp = {
            kind: "availability",
            truck: created,
            status: "unavailable",
          };
          try {
            await api.updateAvailability(created.truck_id, "unavailable");
            results.push({ op: followUp, ok: true });
          } catch (error) {
            results.push({ op: followUp, ok: false, error });
          }
        }
        continue;
      }
      results.push({ op, ok: true });
    } catch (error) {
      results.push({ op, ok: false, error });
    }
  }
  return results;
}

export function describeOp(op) {
  const plate = op.truck?.plate_number || op.payload?.plate_number || "";
  switch (op.kind) {
    case "retire":
      return `Retire ${plate}`;
    case "update":
      return `Update capacity of ${plate}`;
    case "availability":
      return `Mark ${plate} ${op.status}`;
    case "create":
      return `Add ${plate}`;
    default:
      return plate;
  }
}

export function formFromTruck(truck, cardForTruckType) {
  const card = cardForTruckType(truck.truck_type);
  return {
    cardId: card.id,
    customType: card.id === "other" ? truck.truck_type : "",
    bodyType: truck.body_type,
    capacity: formatCapacity(truck.capacity_kg),
    fuel: String(truck.fuel_consumption_l_per_100km ?? ""),
    maintenance: String(truck.maintenance_per_km ?? ""),
    location: truck.current_location || "",
    availability: truck.availability_status,
  };
}

export function buildTruckChanges(truck, form) {
  const truckType = draftTruckType(form);
  if (truckType.length < 2 || truckType.length > 30) {
    return { error: "Truck type must be 2 to 30 characters" };
  }
  const capacity = positive(form.capacity, "Carrying capacity");
  if (capacity.error) return capacity;
  const fuel = positive(form.fuel, "Fuel consumption");
  if (fuel.error) return fuel;
  const maintenance = positive(form.maintenance, "Maintenance cost");
  if (maintenance.error) return maintenance;
  const location = form.location.trim();
  if (location.length > 50)
    return { error: "Location must be 50 characters or fewer" };

  const changes = {};
  if (truckType !== truck.truck_type) changes.truck_type = truckType;
  if (form.bodyType !== truck.body_type) changes.body_type = form.bodyType;
  if (capacity.value !== Number(truck.capacity_kg))
    changes.capacity_kg = capacity.value;
  if (fuel.value !== Number(truck.fuel_consumption_l_per_100km)) {
    changes.fuel_consumption_l_per_100km = fuel.value;
  }
  if (maintenance.value !== Number(truck.maintenance_per_km)) {
    changes.maintenance_per_km = String(maintenance.value);
  }

  if (location !== (truck.current_location || "")) {
    changes.current_location = location || null;
  }

  return {
    changes: Object.keys(changes).length ? changes : null,
    availability:
      form.availability !== truck.availability_status
        ? form.availability
        : null,
  };
}
