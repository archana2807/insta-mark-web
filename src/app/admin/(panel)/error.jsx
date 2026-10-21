"use client";

import { errorMessage } from "@/shared/errors";

/**
 * Shown when an admin section fails to load. Only the safe catalog message is shown;
 * the full error is in the server logs (the digest links the two).
 * @param {{ error: Error & { digest?: string }, reset: () => void }} props
 */
export default function AdminError({ error, reset }) {
  return (
    <div className="admin-card" role="alert">
      <h1 className="h2">This section could not be loaded</h1>
      <p className="text-secondary">{errorMessage("INTERNAL_ERROR")}</p>
      {error.digest && <p className="small text-secondary">Reference: {error.digest}</p>}
      <button type="button" className="btn btn-dark btn-sm" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
