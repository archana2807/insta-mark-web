import Link from "next/link";

// TODO(client): swap for the official SVG logo (public/brand/logo.svg) once
// shared. Until then this mirrors the existing "im" mark + wordmark.
export default function BrandLogo({ light = false, className = "" }) {
  return (
    <Link href="/" className={`brand-logo ${light ? "is-light" : ""} ${className}`.trim()}>
      <span className="brand-logo__mark" aria-hidden="true">
        <span>i</span>m
      </span>
      <span className="brand-logo__text">insta mark</span>
      {/* No aria-label: the accessible name must contain the visible text (WCAG 2.5.3). */}
      <span className="visually-hidden"> — home</span>
    </Link>
  );
}
