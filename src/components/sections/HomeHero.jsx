import Image from "next/image";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon from "@/components/ui/Icon";
import BtnText from "@/components/ui/BtnText";
import ScrollDrift from "@/components/ui/ScrollDrift";

/** Theme hero: huge headline left, full-bleed image right (no vertical label, R-3.4). */
export default function HomeHero({ hero, image, establishedYear }) {
  const years = establishedYear ? new Date().getFullYear() - establishedYear : null;

  return (
    <section className="hero-split" aria-labelledby="hero-title">
      <div className="container-fluid px-0">
        <div className="row g-0">
          <div className="col-lg-6 hero-split__text-col px-3 px-sm-4 px-lg-5">
            <div className="d-flex w-100 ps-xl-4">
              <div className="load-stagger">
                <Eyebrow>{hero.eyebrow}</Eyebrow>
                <h1 id="hero-title">{hero.title}</h1>
                <p className="lead-text mb-5">{hero.text}</p>
                <div className="d-flex flex-wrap gap-3">
                  <Link href={hero.primaryCta.href} className="btn btn-gradient btn-lg">
                    <BtnText>{hero.primaryCta.label}</BtnText> <Icon name="arrow-right" />
                  </Link>
                  <Link href={hero.secondaryCta.href} className="btn btn-outline-ink btn-lg">
                    <BtnText>{hero.secondaryCta.label}</BtnText>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-split__media load-wipe">
              <ScrollDrift className="drift-fill" from={-40} to={40} scale={1.08}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority
                  sizes="(min-width: 992px) 50vw, 100vw"
                />
              </ScrollDrift>
              {years > 0 && (
                <div className="hero-split__badge">
                  <strong>{years}+</strong>
                  <span>Years of signage expertise</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
