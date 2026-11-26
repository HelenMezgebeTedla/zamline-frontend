"use client";

import { useEffect, useId, useRef } from "react";
import Icon from "@/components/ui/Icon";

export default function Dialog({
  open,
  icon,
  tone = "default",
  title,
  description,
  busy = false,
  onClose,
  children,
  actions,
}) {
  const ref = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement;

      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();

      requestAnimationFrame(() => {
        const previousFocus = previousFocusRef.current;

        if (previousFocus?.isConnected) {
          previousFocus.focus();
        }

        previousFocusRef.current = null;
      });
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="zl-dialog"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        margin: 0,
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? textId : undefined}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) {
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) {
          onClose();
        }
      }}
    >
      <div className="zl-dialog-body">
        <div className="zl-dialog-head">
          {icon && (
            <span className={`zl-dialog-icon is-${tone}`}>
              <Icon name={icon} size={20} />
            </span>
          )}

          <div>
            <h2 id={titleId} className="zl-dialog-title">
              {title}
            </h2>

            {description && (
              <p id={textId} className="zl-dialog-text">
                {description}
              </p>
            )}
          </div>
        </div>

        {children}

        <div className="zl-dialog-actions">{actions}</div>
      </div>
    </dialog>
  );
}
