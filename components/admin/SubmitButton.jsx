"use client";

import { useContext } from "react";
import { useFormStatus } from "react-dom";
import { PendingContext } from "./ActionForm";

/**
 * Submit button with a spinner while its form is being processed — works for
 * plain <form action> (useFormStatus) and for ActionForm (PendingContext).
 */
export default function SubmitButton({
  children,
  className = "btn btn-dark",
  confirm,
  disabled,
  ...rest
}) {
  const { pending: actionPending } = useFormStatus();
  const contextPending = useContext(PendingContext);
  const pending = actionPending || contextPending;
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      {...rest}
    >
      {pending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
      {children}
    </button>
  );
}
