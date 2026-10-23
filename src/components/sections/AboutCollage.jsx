import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import DepthFloat from "@/components/ui/DepthFloat";

// The three photos fade in one by one as in the Crafto theme (300 ms apart, 600 ms each).
// Then they float on scroll (client, 23 Oct 2026, after the Synapse mosaic): the left and
// right photos move against each other, one rising while the other sinks and drifting
// apart sideways, and their idle float is in opposite rhythm. The front photo moves less.
const FLOAT = [
  { travelY: 120, travelX: 40, bob: 8, phase: 0 }, // small photo, left
  { travelY: -120, travelX: -40, bob: 8, phase: Math.PI }, // taller photo, right
  { travelY: 60, travelX: 0, bob: 5, phase: Math.PI / 2 }, // biggest photo, in front
];

/**
 * Three overlapping photos that fade in one by one and float against each other on scroll.
 * Without motion (prefers-reduced-motion) they simply sit in place.
 * @param {{ images: { src: string, alt: string }[] }} props
 * @returns {JSX.Element}
 */
export default function AboutCollage({ images }) {
  return (
    <div className="about-collage">
      {images.slice(0, 3).map((img, i) => (
        <DepthFloat className="about-collage__item" {...FLOAT[i]} key={img.src}>
          <Reveal effect="fade" delay={i * 300} className="about-collage__photo">
            <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 25vw, 50vw" />
          </Reveal>
        </DepthFloat>
      ))}
    </div>
  );
}
