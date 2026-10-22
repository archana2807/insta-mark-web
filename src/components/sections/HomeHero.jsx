import Image, { getImageProps } from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import BtnText from "@/components/ui/BtnText";
import ScrollDrift from "@/components/ui/ScrollDrift";
import FancyText from "@/components/ui/FancyText";
import { BANNER } from "@/shared/constants";

/**
 * Admin-uploaded banner with art direction (design.md §4.1): the desktop image from
 * 992 px up, the mobile one below. A missing mobile image falls back to the desktop
 * one, and a missing desktop image to the hand-picked photo.
 * @param {{ banner: { desktop: object | null, mobile: object | null, alt: string | null }, fallback: { src: string, alt: string } }} props
 */
function BannerPicture({ banner, fallback }) {
  const desktop = banner.desktop ?? fallback;
  const mobile = banner.mobile ?? banner.desktop ?? fallback;
  const alt = banner.alt || desktop.alt;
  // The LCP image: load eagerly with high priority (getImageProps has no `priority`).
  const common = { alt, fill: true, loading: "eager", fetchPriority: "high" };
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
 * 1200 px (where the label is hidden) it is a line under the headline.
 */
export default function HomeHero({ hero, image, banner = null }) {
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
                {banner ? (
                  <BannerPicture banner={banner} fallback={image} />
                ) : (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority
                    sizes="(min-width: 992px) 58vw, 100vw"
                  />
                )}
              </ScrollDrift>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
