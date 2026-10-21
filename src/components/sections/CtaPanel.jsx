import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import BtnText from "@/components/ui/BtnText";

export default function CtaPanel({ cta }) {
  return (
    <section className="section-sm">
      <div className="container">
        <Reveal className="cta-panel">
          <div className="row align-items-end g-4">
            <div className="col-lg-8">
              <Eyebrow light>Start your project</Eyebrow>
              <h2 className="mb-4">{cta.title}</h2>
              <p className="mb-0" style={{ maxWidth: "40rem" }}>
                {cta.text}
              </p>
            </div>
            <div className="col-lg-4">
              <div className="cta-panel__actions">
                <Link href={cta.primaryCta.href} className="btn btn-white btn-lg">
                  <BtnText>{cta.primaryCta.label}</BtnText> <Icon name="arrow-right" />
                </Link>
                {cta.secondaryCta && (
                  <Link href={cta.secondaryCta.href} className="btn btn-outline-white btn-lg">
                    <BtnText>{cta.secondaryCta.label}</BtnText>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
