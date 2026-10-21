"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLinkStatus } from "next/link";
import LoadingState from "@/components/shared/LoadingState";

/**
 * Admin content area; the target for the section loading screen.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function AdminMain({ children }) {
  return (
    <main id="admin-content" className="admin-content">
      {children}
    </main>
  );
}

/**
 * Put inside a sidebar <Link>. While that link's section loads, covers the content area
 * with the loading screen. Client-side only: a Suspense boundary (loading.jsx) around
 * the pages left server-action forms pending forever in Next.js 15.5.
 */
export function NavPending() {
  const { pending } = useLinkStatus();
  const [target, setTarget] = useState(/** @type {HTMLElement | null} */ (null));
  useEffect(() => setTarget(document.getElementById("admin-content")), []);
  if (!pending || !target) return null;
  return createPortal(
    <div className="admin-loading">
      <LoadingState />
    </div>,
    target,
  );
}
