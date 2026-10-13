import Image from "next/image";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";

/** Theme "about" block: 3-image collage left, eyebrow + heading + 2 buttons right. */
export default function AboutIntro({ about, images }) {
  return (
    <section className="section" aria-labelledby="about-title">
      <div className="container">
        <div className="row align-items-center g-4 g-lg-5">
          <div className="col-lg-6">
            <div className="about-collage">
              {images.map((img) => (
                <div className="about-collage__item" key={img.src}>
                  <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 25vw, 50vw" />
                </div>
              ))}
            </div>
          </div>
          <Reveal className="col-lg-5 offset-lg-1">
            <Eyebrow>{about.eyebrow}</Eyebrow>
            <h2 id="about-title" className="mb-4">
              {about.title}
            </h2>
            <p className="mb-5">{about.text}</p>
            <div className="d-flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-dark btn-lg">
                <Icon name="building" /> About Insta Mark
              </Link>
              <Link href="/solutions" className="btn btn-outline-ink btn-lg">
                <Icon name="grid" /> Our Solutions
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
