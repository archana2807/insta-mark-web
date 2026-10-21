import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "Trusted by Leading Brands": every project logo in a bordered grid, grey until hovered.
 * @param {{ logos: { name: string, src: string, width: number, height: number }[] }} props
 * @returns {JSX.Element | null} nothing when there are no logos
 */
export default function LogoWall({ logos }) {
  if (!logos?.length) return null;
  return (
    <Reveal as="ul" stagger={60} className="logo-wall list-unstyled mb-0">
      {logos.map((logo) => (
        <li key={logo.name}>
          <Image
            src={logo.src}
            alt={`${logo.name} logo`}
            width={logo.width}
            height={logo.height}
            sizes="160px"
          />
        </li>
      ))}
    </Reveal>
  );
}
