"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget. Renders the hidden `cf-turnstile-response`
 * input inside the surrounding <form>. `resetKey` changes after each failed
 * submission because tokens are single-use.
 */
export default function Turnstile({ siteKey, resetKey }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || widgetId.current !== null) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          appearance: "interaction-only", // invisible unless a challenge is needed
          action: "enquiry",
        });
      })
      .catch(() => console.warn("Turnstile script failed to load"));
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey && widgetId.current !== null && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  return <div ref={ref} className="turnstile-widget" />;
}
