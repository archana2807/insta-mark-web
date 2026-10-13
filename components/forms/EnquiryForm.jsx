"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { submitEnquiry } from "@/lib/actions/enquiry";
import Turnstile from "./Turnstile";
import ClientIcon from "@/components/ui/ClientIcon";

const initialState = { status: "idle" };
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={`form-label ${required ? "required" : ""}`}>
        {label}
      </label>
      {children}
      {error && (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Enquiry / quote form used on the contact page and every category page.
 * Works without JS (plain form POST to the server action); with JS it shows
 * inline errors and a pending state.
 */
export default function EnquiryForm({
  requirementOptions,
  defaultRequirement,
  categorySlug,
  idPrefix = "enq",
}) {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialState);
  const pathname = usePathname();
  const [utm, setUtm] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtm({
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
    });
  }, []);

  const err = (name) => state.fieldErrors?.[name]?.[0];
  const val = (name, fallback = "") => state.values?.[name] ?? fallback;
  const fid = (name) => `${idPrefix}-${name}`;
  const a11y = (name) =>
    err(name) ? { "aria-invalid": true, "aria-describedby": `${fid(name)}-error` } : {};

  return (
    <form action={formAction} className="enquiry-form">
      <div aria-live="polite">
        {state.status === "error" && (
          <div className="alert alert-danger" role="alert">
            {state.message}
          </div>
        )}
      </div>

      {/* Context + anti-spam */}
      <input type="hidden" name="category" value={categorySlug ?? ""} />
      <input type="hidden" name="sourcePage" value={pathname} />
      <input type="hidden" name="utmSource" value={utm.utmSource ?? ""} />
      <input type="hidden" name="utmMedium" value={utm.utmMedium ?? ""} />
      <input type="hidden" name="utmCampaign" value={utm.utmCampaign ?? ""} />
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={fid("website")}>Leave this field empty</label>
        <input id={fid("website")} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          resetKey={state.status === "error" ? state : null}
        />
      )}

      <div className="row g-4">
        <div className="col-md-6">
          <Field id={fid("name")} label="Name" required error={err("name")}>
            <input
              id={fid("name")}
              name="name"
              className={`form-control ${err("name") ? "is-invalid" : ""}`}
              autoComplete="name"
              required
              maxLength={100}
              defaultValue={val("name")}
              key={`name-${state.values?.name}`}
              {...a11y("name")}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field id={fid("company")} label="Company" error={err("company")}>
            <input
              id={fid("company")}
              name="company"
              className="form-control"
              autoComplete="organization"
              maxLength={150}
              defaultValue={val("company")}
              key={`company-${state.values?.company}`}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field id={fid("email")} label="Email" required error={err("email")}>
            <input
              id={fid("email")}
              name="email"
              type="email"
              className={`form-control ${err("email") ? "is-invalid" : ""}`}
              autoComplete="email"
              required
              maxLength={255}
              defaultValue={val("email")}
              key={`email-${state.values?.email}`}
              {...a11y("email")}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field id={fid("phone")} label="Phone" required error={err("phone")}>
            <input
              id={fid("phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              className={`form-control ${err("phone") ? "is-invalid" : ""}`}
              autoComplete="tel"
              placeholder="+91 98765 43210"
              required
              maxLength={20}
              defaultValue={val("phone")}
              key={`phone-${state.values?.phone}`}
              {...a11y("phone")}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field
            id={fid("projectLocation")}
            label="Project location"
            error={err("projectLocation")}
          >
            <input
              id={fid("projectLocation")}
              name="projectLocation"
              className="form-control"
              placeholder="City / site"
              maxLength={150}
              defaultValue={val("projectLocation")}
              key={`loc-${state.values?.projectLocation}`}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field id={fid("requirement")} label="Requirement" error={err("requirement")}>
            <select
              id={fid("requirement")}
              name="requirement"
              className="form-select"
              defaultValue={val("requirement", defaultRequirement ?? "")}
              key={`req-${state.values?.requirement}`}
            >
              <option value="">Select a solution</option>
              {requirementOptions.map((o) => (
                <option value={o} key={o}>
                  {o}
                </option>
              ))}
              <option value="Other">Other / Not sure</option>
            </select>
          </Field>
        </div>
        <div className="col-12">
          <Field id={fid("message")} label="Message" error={err("message")}>
            <textarea
              id={fid("message")}
              name="message"
              rows={4}
              className="form-control"
              placeholder="Tell us about your project, quantities or timelines"
              maxLength={2000}
              defaultValue={val("message")}
              key={`msg-${state.values?.message}`}
            />
          </Field>
        </div>
        <div className="col-12 d-flex flex-column flex-sm-row align-items-sm-center gap-3">
          <button type="submit" className="btn btn-dark btn-lg" disabled={pending}>
            {pending ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Sending…
              </>
            ) : (
              <>
                Get a Quote <ClientIcon name="arrow-right" />
              </>
            )}
          </button>
          <small className="text-secondary">
            Your details are only used to respond to your enquiry.
          </small>
        </div>
      </div>
    </form>
  );
}
