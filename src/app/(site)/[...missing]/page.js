import { notFound } from "next/navigation";

// Unmatched public URLs → app/(site)/not-found.js, so 404s keep the header and footer.
export default function MissingPage() {
  notFound();
}
