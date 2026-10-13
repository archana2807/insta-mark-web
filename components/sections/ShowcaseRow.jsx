import Image from "next/image";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import { pad2 } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/** Theme "latest projects" block: big image + outlined number + copy, alternating sides. */
export default function ShowcaseRow({ category, cover, number, groupLabel, reverse = false }) {
  return (
    <article className="showcase-row">
      <div className={`row align-items-center g-4 g-lg-5 ${reverse ? "flex-lg-row-reverse" : ""}`}>
        <div className="col-lg-7">
          <Link
            href={`/solutions/${category.slug}`}
            className="showcase-row__media d-block"
            tabIndex={-1}
            aria-hidden="true"
          >
            {cover ? (
              <Image src={cover.src} alt="" fill sizes="(min-width: 992px) 58vw, 100vw" />
            ) : (
              <div className="category-hero__placeholder h-100">
                <Icon name={category.icon} />
              </div>
            )}
          </Link>
        </div>
        <Reveal className="col-lg-5">
          <span className="showcase-row__number" data-num={pad2(number)} aria-hidden="true" />
          <Eyebrow>{groupLabel}</Eyebrow>
          <h2>{category.name}</h2>
          <p className="mb-4">{category.shortDescription}</p>
          <Link href={`/solutions/${category.slug}`} className="btn btn-dark btn-lg">
            Explore {category.name} <Icon name="arrow-right" />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
