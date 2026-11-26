import { bodyTypeLabel } from "../../lib/fleet/truckTypes";
import { TrashIcon, UndoIcon } from "./FleetIcons";
import AvailabilityPill from "./AvailabilityPill";

export default function FleetRow({
  truck,
  capacity,
  availability,
  allocated,
  allocationUnknown = false,
  removed,
  error,
  onCapacity,
  onAvailability,
  onRemove,
  onRestore,
  onOpen,
}) {
  const plate = truck.plate_number;

  if (removed) {
    return (
      <li className="fleet-row is-removed">
        <div className="fleet-row__type">
          <span className="fleet-row__name">{truck.truck_type}</span>
          <span className="fleet-row__meta">
            {plate} will be retired when you save
          </span>
        </div>
        <button type="button" className="link-button" onClick={onRestore}>
          <UndoIcon size={14} /> Undo
        </button>
      </li>
    );
  }

  return (
    <li className={`fleet-row${error ? " has-error" : ""}`}>
      <div className="fleet-row__line">
        <button
          type="button"
          className="fleet-row__type truck-link"
          onClick={onOpen}
          aria-label={`View details for ${plate}`}
        >
          <span className="fleet-row__name">{truck.truck_type}</span>
          <span className="fleet-row__meta">
            {plate} · {bodyTypeLabel(truck.body_type)}
          </span>
        </button>

        <label className="capacity">
          <span className="visually-hidden">
            Carrying capacity for {plate} in kg
          </span>
          <input
            inputMode="decimal"
            value={capacity}
            onChange={(e) => onCapacity(e.target.value)}
            disabled={allocated || allocationUnknown}
            title={
              allocated
                ? "Capacity can't change while the truck is on a confirmed shipment"
                : allocationUnknown
                  ? "Turned off until allocation status loads"
                  : undefined
            }
          />
          <span className="capacity__unit">kg</span>
        </label>

        <div className="fleet-row__availability">
          <AvailabilityPill
            status={availability}
            onChange={onAvailability}
            locked={allocated}
            disabled={allocationUnknown}
            label={plate}
          />
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onRemove}
          disabled={allocated || allocationUnknown}
          aria-label={`Retire ${plate}`}
          title={
            allocated
              ? "Allocated trucks can't be retired"
              : allocationUnknown
                ? "Turned off until allocation status loads"
                : `Retire ${plate}`
          }
        >
          <TrashIcon size={16} />
        </button>
      </div>
      {error ? (
        <p className="row-error" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
