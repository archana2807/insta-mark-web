import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

/**
 * Product categories as a photo mosaic (client's grid reference): tiles of different
 * sizes, a grey wash over each photo, the name in white with a yellow line. Each tile
 * opens /solutions/[slug]; the photo turns to colour on hover.
 * @param {{ categories: { slug: string, name: string, icon: string }[],
 *   covers: Record<string, { src: string } | null> }} props
 * @returns {JSX.Element}
 */
export default function ProductMosaic({ categories, covers }) {
  return (
    <Reveal as="ul" stagger={100} className="product-mosaic list-unstyled mb-0">
      {categories.map((c) => {
        const cover = covers[c.slug];
        return (
          <li key={c.slug}>
            <Link href={`/solutions/${c.slug}`} className="product-mosaic__tile">
              {cover ? (
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes="(min-width: 992px) 33vw, 50vw"
                  className="product-mosaic__photo"
                />
              ) : (
                <span className="product-mosaic__placeholder" aria-hidden="true">
                  <Icon name={c.icon} />
                </span>
              )}
              <span className="product-mosaic__label">{c.name}</span>
            </Link>
          </li>
        );
      })}
    </Reveal>
  );
}
