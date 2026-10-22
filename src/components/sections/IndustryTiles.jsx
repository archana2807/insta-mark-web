import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Photo tiles for the top industries of a solution ("Where it is used"): one tall tile and
 * two smaller ones, a grey wash over the photo, the industry in white with a yellow line.
 * @param {{ industries: string[], photos: { src: string, alt?: string }[], label: string }} props
 * @returns {JSX.Element}
 */
export default function IndustryTiles({ industries, photos, label }) {
  return (
    <Reveal as="ul" stagger={150} className="industry-tiles list-unstyled mb-0" aria-label={label}>
      {industries.map((name, i) => {
        const photo = photos[i];
        return (
          <li key={name} className="industry-tiles__tile">
            {photo ? (
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="(min-width: 992px) 25vw, 50vw"
                className="industry-tiles__photo"
              />
            ) : null}
            <span className="industry-tiles__label">{name}</span>
          </li>
        );
      })}
    </Reveal>
  );
}
