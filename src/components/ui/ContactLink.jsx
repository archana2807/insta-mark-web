"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];

/**
 * @param {string | undefined} requirement
 * @param {[string, string][]} extra more query parameters (campaign tags)
 * @returns {string} the Contact page form URL
 */
function contactHref(requirement, extra) {
  const params = new URLSearchParams();
  if (requirement) params.set("requirement", requirement);
  for (const [k, v] of extra) params.set(k, v);
  const query = params.toString();
  return `/contact${query ? `?${query}` : ""}#contact-form`;
}

/**
 * Link to the Contact page form with the requirement pre-selected. Campaign tags (utm_*)
 * of the current page are carried along, so an enquiry sent on the Contact page still
 * counts for the campaign that brought the visitor to this page.
 * @param {{ requirement?: string, className?: string, children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function ContactLink({ requirement, className, children }) {
  const [href, setHref] = useState(() => contactHref(requirement, []));

  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const utm = UTM_KEYS.filter((k) => current.get(k)).map((k) => [k, current.get(k)]);
    setHref(contactHref(requirement, utm));
  }, [requirement]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
