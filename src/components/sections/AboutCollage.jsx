import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import ScrollDrift from "@/components/ui/ScrollDrift";

// How the Crafto "Branding Agency" demo moves its three About photos: each one fades in
// 300 ms after the one before (600 ms, ease-out-quad) and then drifts up or down while
// the section scrolls past, in different directions and by different amounts.
const DRIFT = [
  { from: 50, to: -50 }, // small photo, top-left
  { from: -30, to: 30 }, // taller photo, top-right
  { from: 20, to: -20 }, // biggest photo, in front
];

/**
 * Three overlapping photos that fade in one by one and drift while scrolling.
 * Without motion (prefers-reduced-motion) they simply sit in place.
 * @param {{ images: { src: string, alt: string }[] }} props
 * @returns {JSX.Element}
 */
export default function AboutCollage({ images }) {
  return (
    <div className="about-collage">
      {images.slice(0, 3).map((img, i) => (
        <ScrollDrift
          className="about-collage__item"
          from={DRIFT[i].from}
          to={DRIFT[i].to}
          key={img.src}
        >
          <Reveal effect="fade" delay={i * 300} className="about-collage__photo">
            <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 25vw, 50vw" />
          </Reveal>
        </ScrollDrift>
      ))}
    </div>
  );
}
