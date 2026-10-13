import Image from "next/image";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon from "@/components/ui/Icon";

/** Theme hero: vertical label + huge headline left, full-bleed image right. */
export default function HomeHero({ hero, image, establishedYear }) {
  const years = establishedYear ? new Date().getFullYear() - establishedYear : null;

  return (
    <section className="hero-split" aria-labelledby="hero-title">
      <div className="container-fluid px-0">
        <div className="row g-0">
          <div className="col-lg-6 hero-split__text-col px-3 px-sm-4 px-lg-5">
            <div className="d-flex w-100 ps-xl-4">
              <div className="hero-split__vertical" aria-hidden="true">
                Signage · Wayfinding · Road Safety
              </div>
              <div>
                <Eyebrow>{hero.eyebrow}</Eyebrow>
                <h1 id="hero-title">{hero.title}</h1>
                <p className="lead-text mb-5">{hero.text}</p>
                <div className="d-flex flex-wrap gap-3">
                  <Link href={hero.primaryCta.href} className="btn btn-gradient btn-lg">
                    {hero.primaryCta.label} <Icon name="arrow-right" />
                  </Link>
                  <Link href={hero.secondaryCta.href} className="btn btn-outline-ink btn-lg">
                    {hero.secondaryCta.label}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-split__media">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 992px) 50vw, 100vw"
              />
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
