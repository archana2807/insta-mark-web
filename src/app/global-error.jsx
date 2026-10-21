"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/sentry-client";
import "@/styles/globals.scss";
import { errorMessage } from "@/shared/errors";

/**
 * Last-resort screen when the root layout itself fails (it replaces the whole page).
 * Shows only the safe catalog message; the error goes to Sentry when it is on.
 * @param {{ error: Error & { digest?: string }, reset: () => void }} props
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body>
        <main className="section">
          <div className="container text-center" style={{ maxWidth: "40rem" }}>
            <h1 className="mb-3">Something went wrong</h1>
            <p className="lead-text mb-4">{errorMessage("INTERNAL_ERROR")}</p>
            <button type="button" className="btn btn-dark btn-lg" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
