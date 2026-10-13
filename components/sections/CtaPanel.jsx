import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon from "@/components/ui/Icon";

export default function CtaPanel({ cta }) {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="cta-panel">
          <div className="row align-items-end g-4">
            <div className="col-lg-8">
              <Eyebrow light>Start your project</Eyebrow>
              <h2 className="mb-4">{cta.title}</h2>
              <p className="mb-0" style={{ maxWidth: "40rem" }}>
                {cta.text}
              </p>
            </div>
            <div className="col-lg-4 d-flex flex-wrap gap-3 justify-content-lg-end">
              <Link href={cta.primaryCta.href} className="btn btn-white btn-lg">
                {cta.primaryCta.label} <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
