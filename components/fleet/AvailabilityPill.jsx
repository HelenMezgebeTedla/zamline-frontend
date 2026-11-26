export default function AvailabilityPill({
  status,
  onChange,
  locked = false,
  disabled = false,
  label,
}) {
  if (locked) {
    return (
      <span className="pill pill--allocated" title="On a confirmed shipment">
        Allocated
      </span>
    );
  }

  const available = status === "available";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={label ? `${label} availability` : "Availability"}
      className={`pill ${available ? "pill--available" : "pill--unavailable"}`}
      disabled={disabled}
      title={disabled ? "Turned off until allocation status loads" : undefined}
      onClick={() => onChange(available ? "unavailable" : "available")}
    >
      <span className="pill__dot" aria-hidden="true" />
      <span className="pill__text">
        {available ? "Available" : "Unavailable"}
      </span>
    </button>
  );
}
