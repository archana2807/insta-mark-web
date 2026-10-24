import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import ScrollDrift from "@/components/ui/ScrollDrift";

/**
 * Theme "We create highly unique…" block: tall image left; on the right a large heading
 * (beside the photo, not over it: client, 24 Oct 2026), then copy, optional tags and a
 * highlight box.
 */
export default function OverlapFeature({ id, title, intro, text, image, tags, highlight }) {
  return (
    <section className="section overlap-feature" aria-labelledby={id}>
      <div className="container-fluid px-0">
        <div className="row g-0 align-items-center">
          <div className="col-lg-5">
            <Reveal effect="wipe" className="overlap-feature__media">
              <ScrollDrift className="drift-fill" from={-40} to={40} scale={1.1}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 992px) 42vw, 100vw"
                />
              </ScrollDrift>
            </Reveal>
          </div>
          <div className="col-lg-6 px-3 px-sm-4 px-lg-5 pt-5 pt-lg-0">
            <h2 id={id} className="mb-4">
              {title}
            </h2>
            <Reveal style={{ maxWidth: "36rem" }}>
              {intro && <p className="fs-5 fw-medium text-ink mb-3">{intro}</p>}
              {text && <p className="mb-4">{text}</p>}
              {tags?.length > 0 && (
                <ul className="tag-list mb-4">
                  {tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {highlight && (
                <p className="overlap-feature__highlight mb-0">
                  <Icon name={highlight.icon} />
                  {highlight.text}
                </p>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
