import Link from "next/link";
import TrackLead from "@/components/analytics/TrackLead";
import { pageMetadata } from "@/lib/seo";
import Icon from "@/components/ui/Icon";

// Conversion page for GA4; never indexed.
export const metadata = pageMetadata({
  title: "Thank You",
  description: "Your enquiry has been received.",
  path: "/thank-you",
  noIndex: true,
});

export default function ThankYouPage() {
  return (
    <section className="section">
      <TrackLead />
      <div className="container text-center" style={{ maxWidth: "46rem" }}>
        <Icon name="check2-circle" className="display-3 text-primary" />
        <h1 className="mb-4">Thank you for contacting Insta Mark.</h1>
        <p className="lead-text mx-auto mb-5">
          Our team will review your requirement and get back to you shortly.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <Link href="/projects" className="btn btn-dark btn-lg">
            See our projects <Icon name="arrow-right" />
          </Link>
          <Link href="/" className="btn btn-outline-ink btn-lg">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
