import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import DepthFloat from "@/components/ui/DepthFloat";

// The three photos fade in one by one as in the Crafto theme (300 ms apart, 600 ms each).
// Then they float at three depths (client, 23 Oct 2026, after the Synapse mosaic): the
// big front photo moves most, the small one at the back least, and each bobs gently on
// its own beat, so the collage reads as layers without any big movement.
const DEPTH = [
  { depth: 0.8, phase: 0 }, // small photo, top-left, at the back
  { depth: 0.5, phase: 2.1 }, // taller photo, top-right, in the middle
  { depth: 0.15, phase: 4.2 }, // biggest photo, in front
];

/**
 * Three overlapping photos that fade in one by one and float at different depths on scroll.
 * Without motion (prefers-reduced-motion) they simply sit in place.
 * @param {{ images: { src: string, alt: string }[] }} props
 * @returns {JSX.Element}
 */
export default function AboutCollage({ images }) {
  return (
    <div className="about-collage">
      {images.slice(0, 3).map((img, i) => (
        <DepthFloat className="about-collage__item" {...DEPTH[i]} key={img.src}>
          <Reveal effect="fade" delay={i * 300} className="about-collage__photo">
            <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 25vw, 50vw" />
          </Reveal>
        </DepthFloat>
      ))}
    </div>
  );
}
