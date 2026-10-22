import Image, { getImageProps } from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import BtnText from "@/components/ui/BtnText";
import ScrollDrift from "@/components/ui/ScrollDrift";
import FancyText from "@/components/ui/FancyText";
import HeroSlider from "@/components/sections/HeroSlider";
import { BANNER } from "@/shared/constants";

/**
 * One admin-uploaded slide with art direction (design.md §4.1): the desktop image from
 * 992 px up, the mobile one below. A missing mobile image falls back to the desktop
 * one, and a missing desktop image to the hand-picked photo. Only the first slide is the
 * LCP image (eager, high priority); the others load lazily.
 * @param {{ banner: { desktop: object | null, mobile: object | null, alt: string | null }, fallback: { src: string, alt: string }, first: boolean }} props
 */
function BannerPicture({ banner, fallback, first }) {
  const desktop = banner.desktop ?? fallback;
  const mobile = banner.mobile ?? banner.desktop ?? fallback;
  const alt = banner.alt || desktop.alt;
  // The LCP image: load eagerly with high priority (getImageProps has no `priority`).
  const common = first
    ? { alt, fill: true, loading: "eager", fetchPriority: "high" }
    : { alt, fill: true, loading: "lazy" };
  const {
    props: { srcSet: desktopSrcSet, sizes: desktopSizes },
  } = getImageProps({ ...common, src: desktop.src, sizes: "58vw" });
  const { props: mobileProps } = getImageProps({ ...common, src: mobile.src, sizes: "100vw" });
  return (
    <picture>
      <source
        media={`(min-width: ${BANNER.breakpoint}px)`}
        srcSet={desktopSrcSet}
        sizes={desktopSizes}
      />
      <img {...mobileProps} alt={alt} />
    </picture>
  );
}

/**
 * Theme hero (Crafto "Branding Agency"): text left, photo right; the headline runs onto
 * the photo. On wide screens the tagline is the vertical label on the left; below
 * 1200 px (where the label is hidden) it is a line under the headline. The photo is a
 * slider of 1–3 slides (task 10h): the slides uploaded in Admin → Banner, or, until there
 * are any, three hand-picked photos. The headline and tagline never change with the slide.
 * @param {{ hero: object, image: { src: string, alt: string },
 *   slides: { src: string, alt: string }[],
 *   banner?: { desktop: object | null, mobile: object | null, alt: string | null }[] | null }} props
 * @returns {JSX.Element}
 */
export default function HomeHero({ hero, image, slides = [], banner = null }) {
  const slideNodes = banner
    ? banner.map((b, i) => <BannerPicture banner={b} fallback={image} first={i === 0} key={i} />)
    : (slides.length ? slides : [image]).map((img, i) => (
        <Image
          src={img.src}
          alt={img.alt}
          fill
          priority={i === 0}
          sizes="(min-width: 992px) 58vw, 100vw"
          key={img.src}
        />
      ));

  return (
    <section className="hero-split" aria-labelledby="hero-title">
      <div className="container-fluid px-0">
        <div className="row g-0">
          <div className="col-lg-5 hero-split__text-col px-3 px-sm-4 px-lg-5">
            <div className="d-flex w-100 ps-xl-4">
              <p className="hero-split__vertical">
                <span className="visually-hidden">{hero.tagline}</span>
                <span aria-hidden="true">
                  <FancyText text={hero.tagline} />
                </span>
              </p>
              <div className="load-stagger">
                <h1 id="hero-title">{hero.title}</h1>
                <p className="hero-split__tagline">{hero.tagline}</p>
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
          <div className="col-lg-7 order-first order-lg-last">
            <div className="hero-split__media load-wipe">
              <ScrollDrift className="drift-fill" from={-40} to={40} scale={1.08}>
                <HeroSlider slides={slideNodes} label="Featured signage projects" />
              </ScrollDrift>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
