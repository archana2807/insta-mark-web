import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { pad2 } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/** Product category cards → /solutions/[slug] (meeting: "grid after the intro"). */
export default function CategoryGrid({
  categories,
  covers,
  headingLevel = "h3",
  showNumbers = true,
}) {
  const Title = headingLevel;

  return (
    <div className="row g-4 gy-5">
      {categories.map((c, i) => {
        const cover = covers[c.slug];
        return (
          <Reveal className="col-sm-6 col-lg-3" key={c.slug} delay={(i % 4) * 80}>
            <Link href={`/solutions/${c.slug}`} className="category-card">
              <div className="category-card__media">
                {cover ? (
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    sizes="(min-width: 992px) 25vw, (min-width: 576px) 50vw, 100vw"
                  />
                ) : (
                  <div className="category-card__placeholder" aria-hidden="true">
                    <Icon name={c.icon} />
                  </div>
                )}
                {showNumbers && <span className="category-card__number">{pad2(i + 1)}</span>}
              </div>
              <div className="category-card__body">
                <Title className="category-card__title">{c.name}</Title>
                <p className="category-card__text">{c.shortDescription}</p>
                <span className="link-arrow">
                  View solution <Icon name="arrow-right" />
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
