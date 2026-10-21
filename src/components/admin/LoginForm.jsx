"use client";

import { useActionState } from "react";
import { login } from "@/server/modules/auth/auth.controller";
import SubmitButton from "./SubmitButton";

export default function LoginForm({ next }) {
  const [state, action] = useActionState(login, {});

  return (
    <form action={action} className="enquiry-form">
      <div aria-live="polite">
        {state.error && (
          <div className="alert alert-danger" role="alert">
            {state.error}
          </div>
        )}
      </div>
      <input type="hidden" name="next" value={next} />
      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-control"
          autoComplete="username"
          required
          defaultValue={state.email ?? ""}
          key={state.email ?? "email"}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-control"
          autoComplete="current-password"
          required
        />
      </div>
      <SubmitButton className="btn btn-dark w-100">Sign in</SubmitButton>
    </form>
  );
}
