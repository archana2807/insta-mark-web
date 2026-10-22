import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import AboutCollage from "@/components/sections/AboutCollage";
import BtnText from "@/components/ui/BtnText";

/**
 * Home "about" (Crafto "Branding Agency" layout): three overlapping photos on the left,
 * heading, the client's two paragraphs and two buttons on the right.
 * @param {{ about: { title: string, paragraphs: string[] },
 *   images: { src: string, alt: string }[] }} props
 * @returns {JSX.Element}
 */
export default function AboutIntro({ about, images }) {
  return (
    <section className="section about-short" aria-labelledby="about-title">
      <div className="container">
        <div className="row align-items-center g-4 g-lg-5">
          <div className="col-lg-6">
            <AboutCollage images={images} />
          </div>
          <Reveal className="col-lg-5 offset-lg-1">
            <h2 id="about-title" className="about-short__title mb-4">
              {about.title}
            </h2>
            {about.paragraphs.map((text, i) => (
              <p className={i === about.paragraphs.length - 1 ? "mb-5" : "mb-3"} key={text}>
                {text}
              </p>
            ))}
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
