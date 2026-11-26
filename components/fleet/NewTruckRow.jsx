import { BODY_TYPES, TRUCK_TYPES } from "../../lib/fleet/truckTypes";
import { TrashIcon } from "./FleetIcons";
import AvailabilityPill from "./AvailabilityPill";

export default function NewTruckRow({
  draft,
  register,
  setValue,
  index,
  onRemove,
  isSubmitting,
}) {
  const id = draft.id || draft.key;

  return (
    <li
      className={`fleet-row fleet-row--new${draft.error ? " has-error" : ""}`}
    >
      <div className="fleet-row__line">
        <div className="fleet-row__type">
          <label className="visually-hidden" htmlFor={`${id}-type`}>
            Truck type
          </label>
          <select
            id={`${id}-type`}
            className="field field--type"
            disabled={isSubmitting}
            {...register(`trucks.${index}.cardId`, {
              onChange: (e) => {
                const card = TRUCK_TYPES.find((t) => t.id === e.target.value);
                if (card) {
                  setValue(`trucks.${index}.bodyType`, card.bodyType);
                }
              },
            })}
          >
            {TRUCK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {draft.cardId === "other" ? (
            <>
              <label className="visually-hidden" htmlFor={`${id}-custom`}>
                Name this truck type
              </label>
              <input
                id={`${id}-custom`}
                className="field field--type"
                placeholder="e.g. Lowbed"
                maxLength={30}
                disabled={isSubmitting}
                {...register(`trucks.${index}.customType`)}
              />
            </>
          ) : null}
        </div>

        <label className="capacity">
          <span className="visually-hidden">Carrying capacity in kg</span>
          <input
            inputMode="decimal"
            placeholder="25,000"
            disabled={isSubmitting}
            {...register(`trucks.${index}.capacity`, {
              required: "Capacity is required",
            })}
          />
          <span className="capacity__unit">kg</span>
        </label>

        <div className="fleet-row__availability">
          <AvailabilityPill
            status={draft.availability}
            disabled={isSubmitting}
            onChange={(value) =>
              setValue(`trucks.${index}.availability`, value)
            }
            label="New truck"
          />
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onRemove}
          disabled={isSubmitting}
          aria-label="Remove this new truck"
        >
          <TrashIcon size={16} />
        </button>
      </div>

      <div className="new-truck__fields">
        <label>
          <span>Plate number</span>
          <input
            className="field"
            placeholder="BAA 1234"
            maxLength={20}
            disabled={isSubmitting}
            {...register(`trucks.${index}.plate`, {
              required: "Plate number is required",
            })}
          />
        </label>
        <label>
          <span>Body type</span>
          <select
            className="field"
            disabled={isSubmitting}
            {...register(`trucks.${index}.bodyType`)}
          >
            {BODY_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fuel use (L/100 km)</span>
          <input
            className="field"
            inputMode="decimal"
            placeholder="32"
            disabled={isSubmitting}
            {...register(`trucks.${index}.fuel`)}
          />
        </label>
        <label>
          <span>Maintenance (ZMW/km)</span>
          <input
            className="field"
            inputMode="decimal"
            placeholder="1.50"
            disabled={isSubmitting}
            {...register(`trucks.${index}.maintenance`)}
          />
        </label>
        <label>
          <span>Current location (optional)</span>
          <input
            className="field"
            placeholder="Lusaka"
            maxLength={50}
            disabled={isSubmitting}
            {...register(`trucks.${index}.location`)}
          />
        </label>
      </div>
      {draft.error ? (
        <p className="row-error" role="alert">
          {draft.error}
        </p>
      ) : null}
    </li>
  );
}
