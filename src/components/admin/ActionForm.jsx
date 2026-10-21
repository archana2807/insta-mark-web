"use client";

import { createContext, startTransition, useActionState, useEffect, useRef } from "react";

/** Lets SubmitButton show a spinner for forms submitted via onSubmit. */
export const PendingContext = createContext(false);

/**
 * Generic wrapper for admin server actions that return
 * { ok?, message?, error?, fieldErrors?, reset? }.
 *
 * Submits via onSubmit instead of <form action>: React 19 automatically resets
 * uncontrolled fields after every form action — including failed ones — which
 * would wipe what the admin typed whenever validation fails. Here the form is
 * only reset after a successful save, and only when `resetOnSuccess` is set.
 */
export default function ActionForm({ action, children, className = "", resetOnSuccess = false }) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef(null);

  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget, e.nativeEvent.submitter);
    startTransition(() => formAction(data));
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      <div aria-live="polite">
        {state.error && <div className="alert alert-danger py-2">{state.error}</div>}
        {state.ok && state.message && (
          <div className="alert alert-success py-2">{state.message}</div>
        )}
        {state.fieldErrors && (
          <div className="alert alert-danger py-2">
            {Object.entries(state.fieldErrors).map(([field, msgs]) => (
              <div key={field}>
                <strong>{field}:</strong> {msgs.join(" ")}
              </div>
            ))}
          </div>
        )}
      </div>
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}
