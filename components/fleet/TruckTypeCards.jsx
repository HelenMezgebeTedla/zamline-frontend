import Image from "next/image";
import { TRUCK_TYPES } from "../../lib/fleet/truckTypes";
import { CheckIcon, TruckIcon } from "./FleetIcons";

export default function TruckTypeCards({ selected, onToggle }) {
  return (
    <section className="type-panel" aria-label="Truck types">
      <ul className="type-grid">
        {TRUCK_TYPES.map((type) => {
          const checked = selected.has(type.id);
          return (
            <li key={type.id}>
              <button
                type="button"
                className={`type-card${type.id === "semi-trailer" ? " type-card--wide" : ""}`}
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggle(type.id)}
                title={
                  checked
                    ? `Hide ${type.name} trucks`
                    : `Show ${type.name} trucks`
                }
              >
                <span className="type-card__media">
                  {type.image ? (
                    <Image
                      src={type.image}
                      alt=""
                      width={type.id === "semi-trailer" ? 237 : 164}
                      height={type.id === "semi-trailer" ? 83 : 80}
                    />
                  ) : (
                    <span className="type-card__other">
                      <TruckIcon size={40} />
                    </span>
                  )}
                </span>
                <span className="type-card__body">
                  <span className="type-card__text">
                    <span className="type-card__name">{type.name}</span>
                    <span className="type-card__desc">{type.description}</span>
                  </span>
                  <span
                    className={`checkbox${checked ? " is-checked" : ""}`}
                    aria-hidden="true"
                  >
                    {checked ? <CheckIcon size={11} /> : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
