"use client";

import { useEffect } from "react";
import { LEAD_COOKIE } from "@/shared/constants";

/**
 * Takes the one-time lead cookie; true only right after a real, accepted enquiry.
 * Honeypot hits, direct visits and reloads of the thank-you page have no cookie.
 * @returns {boolean}
 */
function takeLeadCookie() {
  const isLead = document.cookie.split("; ").some((c) => c === `${LEAD_COOKIE.name}=1`);
  if (isLead) document.cookie = `${LEAD_COOKIE.name}=; Max-Age=0; path=${LEAD_COOKIE.path}`;
  return isLead;
}

/**
 * Fires the GA4 `generate_lead` conversion once, only for a real enquiry. The event is
 * queued on dataLayer; gtag.js (loaded only when NEXT_PUBLIC_GA_ID is set) sends it, as
 * in the official snippet. Without GA nothing leaves the browser.
 */
export default function TrackLead() {
  useEffect(() => {
    if (!takeLeadCookie()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
    window.gtag("event", "generate_lead", { form_name: "enquiry" });
  }, []);
  return null;
}
