"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { submitEnquiry } from "@/server/modules/enquiries/enquiry.controller";
import {
  LIMITS,
  OTHER_REQUIREMENT,
  cleanField,
  suggestEmail,
  validateField,
} from "@/shared/schemas/enquiry-rules";
import { resultMessage } from "@/shared/errors";
import Turnstile from "./Turnstile";
import ClientIcon from "@/components/ui/ClientIcon";
import BtnText from "@/components/ui/BtnText";

const initialState = { status: "idle" };
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Visible fields in DOM order (error summary + focus order). */
const FIELDS = [
  ["name", "Name"],
  ["company", "Company"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["projectLocation", "Project location"],
  ["requirement", "Requirement"],
  ["message", "Message"],
];
const LABELS = Object.fromEntries(FIELDS);

function Field({ id, label, required, error, hint, extra, children }) {
  return (
    <div>
      <label htmlFor={id} className={`form-label ${required ? "required" : ""}`}>
        {label}
        {required && <span className="visually-hidden"> (required)</span>}
      </label>
      {children}
      {error && (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      )}
      {extra}
      {hint && !error && (
        <div id={`${id}-hint`} className="form-text">
          {hint}
        </div>
      )}
    </div>
  );
}

/**
 * Enquiry / quote form used on the contact page and every category page.
 * Without JS it is a plain form POST with native validation. With JS it
 * validates each field on blur (same rules as the server — enquiry-rules.js),
 * blocks submit with an error summary and focuses the first invalid field.
 * The server re-validates everything.
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
  const [enhanced, setEnhanced] = useState(false);
  // Client verdicts override server errors per field (null = fixed since).
  const [clientErrors, setClientErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [messageLength, setMessageLength] = useState(state.values?.message?.length ?? 0);
  const formRef = useRef(null);
  const summaryRef = useRef(null);
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
    setEnhanced(true);
    const params = new URLSearchParams(window.location.search);
    setUtm({
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
    });
  }, []);

  // New server response: drop stale client verdicts and move focus to the summary.
  useEffect(() => {
    if (state.status !== "error") return;
    setClientErrors({});
    setMessageLength(state.values?.message?.length ?? 0);
    summaryRef.current?.focus();
  }, [state]);

  const fid = (name) => `${idPrefix}-${name}`;
  const err = (name) =>
    name in clientErrors ? clientErrors[name] : (state.fieldErrors?.[name]?.[0] ?? null);
  const val = (name, fallback = "") => state.values?.[name] ?? fallback;
  const options = { requirementOptions };

  const check = (name, value) => validateField(name, cleanField(name, value), options);

  const a11y = (name, { hint, extra } = {}) => {
    const describedBy = [
      err(name) && `${fid(name)}-error`,
      hint && !err(name) && `${fid(name)}-hint`,
      extra,
    ].filter(Boolean);
    return {
      "aria-invalid": err(name) ? true : undefined,
      "aria-describedby": describedBy.length ? describedBy.join(" ") : undefined,
    };
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    if (!(name in LABELS)) return;
    // Don't nag about an untouched empty field until submit.
    if (value === "" && !(name in clientErrors) && !state.fieldErrors?.[name]) return;
    setClientErrors((prev) => ({ ...prev, [name]: check(name, value) }));
    if (name === "email") setEmailSuggestion(check(name, value) ? null : suggestEmail(value));
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "message") setMessageLength(value.length);
    if (name === "email") setEmailSuggestion(null);
    // Once a field shows an error, re-check as the user types so it clears immediately.
    if (err(name)) setClientErrors((prev) => ({ ...prev, [name]: check(name, value) }));
  };

  const onSubmit = (e) => {
    const form = e.currentTarget;
    const data = new FormData(form);
    const errors = Object.fromEntries(
      FIELDS.map(([name]) => [name, check(name, String(data.get(name) ?? ""))]),
    );
    setClientErrors(errors);
    const firstInvalid = FIELDS.find(([name]) => errors[name]);
    if (firstInvalid) {
      e.preventDefault();
      setShowSummary(true);
      form.elements.namedItem(firstInvalid[0])?.focus();
      return;
    }
    setShowSummary(false);
    form.elements.namedItem("fillMs").value = String(Date.now() - openedAt.current);
  };

  const applySuggestion = () => {
    const input = formRef.current?.elements.namedItem("email");
    if (!input || !emailSuggestion) return;
    input.value = emailSuggestion;
    setEmailSuggestion(null);
    setClientErrors((prev) => ({ ...prev, email: null }));
    input.focus();
  };

  const invalid = FIELDS.filter(([name]) => err(name));
  // Non-field server problems (rate limit, captcha, outage, too fast).
  const serverNotice = state.status === "error" && !state.fieldErrors ? resultMessage(state) : null;
  const summaryVisible =
    (showSummary || state.status === "error") && (invalid.length > 0 || serverNotice);
  const summaryTitle = invalid.length
    ? `Please correct ${invalid.length === 1 ? "this field" : `these ${invalid.length} fields`}:`
    : serverNotice;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onBlur={onBlur}
      onChange={onChange}
      noValidate={enhanced}
      className="enquiry-form"
    >
      <div aria-live="polite">
        {summaryVisible && (
          <div className="alert alert-danger" role="alert" tabIndex={-1} ref={summaryRef}>
            <p className="fw-semibold mb-0">{summaryTitle}</p>
            {invalid.length > 0 && (
              <ul className="mb-0 mt-2 ps-3">
                {invalid.map(([name, label]) => (
                  <li key={name}>
                    <a href={`#${fid(name)}`} className="alert-link">
                      {label}: {err(name)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Context + anti-spam */}
      <input type="hidden" name="category" value={categorySlug ?? ""} />
      <input type="hidden" name="sourcePage" value={pathname} />
      <input type="hidden" name="utmSource" value={utm.utmSource ?? ""} />
      <input type="hidden" name="utmMedium" value={utm.utmMedium ?? ""} />
      <input type="hidden" name="utmCampaign" value={utm.utmCampaign ?? ""} />
      {enhanced && <input type="hidden" name="fillMs" defaultValue="" />}
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
              autoCapitalize="words"
              required
              minLength={2}
              maxLength={LIMITS.name}
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
              className={`form-control ${err("company") ? "is-invalid" : ""}`}
              autoComplete="organization"
              maxLength={LIMITS.company}
              defaultValue={val("company")}
              key={`company-${state.values?.company}`}
              {...a11y("company")}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field
            id={fid("email")}
            label="Email"
            required
            error={err("email")}
            extra={
              emailSuggestion && (
                <div id={`${fid("email")}-suggest`} className="form-text" aria-live="polite">
                  Did you mean{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0 align-baseline fw-semibold"
                    onClick={applySuggestion}
                  >
                    {emailSuggestion}
                  </button>
                  ?
                </div>
              )
            }
          >
            <input
              id={fid("email")}
              name="email"
              type="email"
              inputMode="email"
              spellCheck={false}
              autoCapitalize="off"
              className={`form-control ${err("email") ? "is-invalid" : ""}`}
              autoComplete="email"
              required
              maxLength={LIMITS.email}
              defaultValue={val("email")}
              key={`email-${state.values?.email}`}
              {...a11y("email", { extra: emailSuggestion && `${fid("email")}-suggest` })}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field
            id={fid("phone")}
            label="Phone"
            required
            error={err("phone")}
            hint="Mobile or landline. Add the country code if outside India."
          >
            <input
              id={fid("phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              className={`form-control ${err("phone") ? "is-invalid" : ""}`}
              autoComplete="tel"
              placeholder="e.g. 98200 12345"
              required
              maxLength={LIMITS.phone}
              defaultValue={val("phone")}
              key={`phone-${state.values?.phone}`}
              {...a11y("phone", { hint: true })}
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
              className={`form-control ${err("projectLocation") ? "is-invalid" : ""}`}
              autoComplete="address-level2"
              placeholder="City / site"
              maxLength={LIMITS.projectLocation}
              defaultValue={val("projectLocation")}
              key={`loc-${state.values?.projectLocation}`}
              {...a11y("projectLocation")}
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field id={fid("requirement")} label="Requirement" error={err("requirement")}>
            <select
              id={fid("requirement")}
              name="requirement"
              className={`form-select ${err("requirement") ? "is-invalid" : ""}`}
              defaultValue={val("requirement", defaultRequirement ?? "")}
              key={`req-${state.values?.requirement}`}
              {...a11y("requirement")}
            >
              <option value="">Select a solution</option>
              {requirementOptions.map((o) => (
                <option value={o} key={o}>
                  {o}
                </option>
              ))}
              <option value={OTHER_REQUIREMENT}>Other / Not sure</option>
            </select>
          </Field>
        </div>
        <div className="col-12">
          <Field
            id={fid("message")}
            label="Message"
            error={err("message")}
            extra={
              <div
                id={`${fid("message")}-count`}
                className={`form-text text-end ${messageLength > LIMITS.message * 0.9 ? "text-danger" : ""}`}
              >
                {messageLength} / {LIMITS.message} characters
              </div>
            }
          >
            <textarea
              id={fid("message")}
              name="message"
              rows={4}
              className={`form-control ${err("message") ? "is-invalid" : ""}`}
              placeholder="Tell us about your project, quantities or timelines"
              maxLength={LIMITS.message}
              defaultValue={val("message")}
              key={`msg-${state.values?.message}`}
              {...a11y("message", { extra: `${fid("message")}-count` })}
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
                <BtnText>Get a Quote</BtnText> <ClientIcon name="arrow-right" />
              </>
            )}
          </button>
          <small className="text-secondary">
            <span aria-hidden="true">*</span> Required. Your details are only used to respond to
            your enquiry.
          </small>
        </div>
      </div>
    </form>
  );
}
