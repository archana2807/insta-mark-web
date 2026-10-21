import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import ScrollDrift from "@/components/ui/ScrollDrift";
import BtnText from "@/components/ui/BtnText";
import { pad2 } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/**
 * One solution, laid out like a Crafto "Branding Agency – Services" block:
 * big number · title · write-up with two feature lists, then two photos
 * (8/4 split) that drift in opposite directions while scrolling and are
 * uncovered by left→right / right→left wipes. Alternate rows swap the photos.
 */
export default function ShowcaseRow({ category, images = [], number, reverse = false }) {
  const features = category.features ?? [];
  const half = Math.ceil(features.length / 2);
  const lists = [features.slice(0, half), features.slice(half)].filter((l) => l.length);
  const [big, small] = images;
  const href = `/solutions/${category.slug}`;

  const photo = (img, variant, wipe, drift) => (
    <ScrollDrift from={drift[0]} to={drift[1]}>
      <Reveal effect={wipe}>
        <Link
          href={href}
          className={`service-block__photo service-block__photo--${variant}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={img.src}
            alt=""
            fill
            sizes={
              variant === "big"
                ? "(min-width: 768px) 66vw, 100vw"
                : "(min-width: 768px) 33vw, 100vw"
            }
          />
        </Link>
      </Reveal>
    </ScrollDrift>
  );

  return (
    <article className="service-block" aria-labelledby={`svc-${category.slug}`}>
      <div className="row mb-5 mb-lg-6">
        <div className="col-md-2 text-md-end">
          <span className="service-block__number" data-num={pad2(number)} aria-hidden="true" />
        </div>
        <Reveal stagger={300} className="col-xl-3 col-lg-4 col-md-10 mt-3 mt-md-0">
          <h2 id={`svc-${category.slug}`} className="service-block__title">
            <Link href={href}>{category.name}</Link>
          </h2>
        </Reveal>
        <div className="col-lg-6 offset-xl-1 offset-md-2 offset-lg-0 mt-4 mt-lg-0">
          <Reveal stagger={300}>
            <p>{category.shortDescription}</p>
          </Reveal>
          {lists.length > 0 && (
            <div className="row g-3 mt-1">
              {lists.map((list, i) => (
                <div className="col-sm-6" key={i}>
                  <Reveal as="ul" effect="flip-y" stagger={150} className="plus-list">
                    {list.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </Reveal>
                </div>
              ))}
            </div>
          )}
          <Reveal className="mt-4">
            <Link href={href} className="btn btn-dark btn-lg">
              <BtnText>{`Explore ${category.name}`}</BtnText> <Icon name="arrow-right" />
            </Link>
          </Reveal>
        </div>
      </div>

      {big ? (
        <div className={`row g-3 g-md-4 align-items-start ${reverse ? "flex-md-row-reverse" : ""}`}>
          <div className={small ? "col-md-8" : "col-12"}>
            {photo(big, "big", reverse ? "wipe-rl" : "wipe", [-30, 30])}
          </div>
          {small && (
            <div className="col-md-4">
              {photo(small, "small", reverse ? "wipe" : "wipe-rl", [30, -30])}
            </div>
          )}
        </div>
      ) : (
        <Reveal effect="wipe" className="service-block__placeholder" aria-hidden="true">
          <Icon name={category.icon} />
        </Reveal>
      )}
    </article>
  );
}
