// Browser start-up: when NEXT_PUBLIC_SENTRY_DSN is set, load Sentry after the page is
// idle so uncaught browser errors are reported (D6). Without it nothing happens.
import { loadSentry } from "@/lib/sentry-client";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const start = () => loadSentry();
  if ("requestIdleCallback" in window) window.requestIdleCallback(start);
  else setTimeout(start, 2000);
}
