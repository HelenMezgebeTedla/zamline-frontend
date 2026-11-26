export default function Field({ id, label, children, hint, error }) {
  return (
    <div className="edit-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="edit-hint edit-hint--error">
          {error}
        </p>
      ) : hint ? (
        <p className="edit-hint">{hint}</p>
      ) : null}
    </div>
  );
}
