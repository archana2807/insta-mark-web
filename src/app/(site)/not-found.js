import NotFoundContent from "@/components/sections/NotFoundContent";

export const metadata = { title: "Page not found", robots: { index: false } };

/** 404 inside the site shell (header + footer). */
export default function NotFound() {
  return <NotFoundContent />;
}
