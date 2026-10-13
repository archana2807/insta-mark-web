import NotFoundContent from "@/components/sections/NotFoundContent";

export const metadata = { title: "Page not found" };

// Fallback outside the public site (e.g. /admin/*). Public URLs use app/(site)/not-found.js.
export default function NotFound() {
  return (
    <main>
      <NotFoundContent />
    </main>
  );
}
