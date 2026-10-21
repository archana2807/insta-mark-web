import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon from "@/components/ui/Icon";

/** Home "about": one or two lines only (meeting), then straight to the products. */
export default function AboutIntro({ about }) {
  return (
    <section className="section-sm about-short" aria-labelledby="about-title">
      <div className="container">
        <div className="row g-4 align-items-end">
          <div className="col-lg-6">
            <Eyebrow>{about.eyebrow}</Eyebrow>
            <h2 id="about-title" className="mb-0">
              {about.title}
            </h2>
          </div>
          <div className="col-lg-5 offset-lg-1">
            <p className="fs-5 mb-3">{about.short}</p>
            <Link href="/about" className="link-arrow">
              More about Insta Mark <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
