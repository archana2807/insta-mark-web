"use client";

import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Fires the GA4 `generate_lead` conversion once on the thank-you page.
 * If gtag.js has not loaded yet, the call is queued on dataLayer and sent
 * as soon as it loads (same mechanism as the official snippet).
 */
export default function TrackLead() {
  useEffect(() => {
    if (!GA_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments); // eslint-disable-line prefer-rest-params
      };
    window.gtag("event", "generate_lead", { form_name: "enquiry" });
  }, []);
  return null;
}
