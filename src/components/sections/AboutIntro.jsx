import Image from "next/image";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import BtnText from "@/components/ui/BtnText";

/**
 * Home "about" (Crafto "Branding Agency" layout): three overlapping photos on the left,
 * label, heading, short paragraph and two buttons on the right.
 * @param {{ about: { eyebrow: string, title: string, short: string },
 *   images: { src: string, alt: string }[] }} props
 * @returns {JSX.Element}
 */
export default function AboutIntro({ about, images }) {
  return (
    <section className="section about-short" aria-labelledby="about-title">
      <div className="container">
        <div className="row align-items-center g-4 g-lg-5">
          <div className="col-lg-6">
            <div className="about-collage">
              {images.slice(0, 3).map((img, i) => (
                <Reveal effect="wipe" delay={i * 200} className="about-collage__item" key={img.src}>
                  <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 25vw, 50vw" />
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal className="col-lg-5 offset-lg-1">
            <Eyebrow>{about.eyebrow}</Eyebrow>
            <h2 id="about-title" className="about-short__title mb-4">
              {about.title}
            </h2>
            <p className="fs-5 mb-5">{about.short}</p>
            <div className="d-flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-dark btn-lg">
                <Icon name="arrow-right" /> <BtnText>More about us</BtnText>
              </Link>
              <Link href="/solutions" className="btn btn-outline-ink btn-lg">
                <Icon name="grid" /> <BtnText>Our solutions</BtnText>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
