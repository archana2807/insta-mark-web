import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Row of project logos right under the home banner (Crafto "Branding Agency" look).
 * @param {{ logos: { name: string, src: string, width: number, height: number }[] }} props
 * @returns {JSX.Element | null} nothing when there are no logos
 */
export default function ProjectLogos({ logos }) {
  if (!logos?.length) return null;
  return (
    <section className="project-logos" aria-label="Projects we have worked on">
      <div className="container">
        <Reveal as="ul" stagger={150} className="project-logos__list list-unstyled mb-0">
          {logos.map((logo) => (
            <li key={logo.name}>
              <Image
                src={logo.src}
                alt={`${logo.name} logo`}
                width={logo.width}
                height={logo.height}
                sizes="190px"
              />
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
