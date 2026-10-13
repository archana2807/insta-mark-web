import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="section">
      <div className="container text-center" style={{ maxWidth: "40rem" }}>
        <p className="showcase-row__number mb-3" data-num="404" aria-hidden="true" />
        <h1 className="h2 mb-4">This page could not be found.</h1>
        <p className="mb-5">The link may be broken or the page may have moved.</p>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <Link href="/" className="btn btn-dark btn-lg">
            Back to home
          </Link>
          <Link href="/solutions" className="btn btn-outline-ink btn-lg">
            Browse solutions
          </Link>
        </div>
      </div>
    </main>
  );
}
