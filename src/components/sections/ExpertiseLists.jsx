import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";

/** "Our expertise": the two service groups from the client's content (Solutions page). */
export default function ExpertiseLists({ expertise }) {
  const groups = [
    {
      key: "architectural",
      title: "Architectural Signage",
      icon: "signpost-split",
      items: expertise.architectural,
    },
    {
      key: "road",
      title: "Road Safety Solutions",
      icon: "cone-striped",
      items: expertise.roadSafety,
    },
  ];

  return (
    <section className="section bg-surface" aria-labelledby="expertise-title">
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-4">
            <SectionHeading
              title={<span id="expertise-title">Everything Your Project Needs, from One Team</span>}
              text="Design, manufacturing and installation for interior and exterior signage and on-ground road safety."
            />
            <Link href="/contact#contact-form" className="link-arrow mt-4">
              Request a quote <Icon name="arrow-right" />
            </Link>
          </div>
          {groups.map((g, i) => (
            <Reveal className="col-md-6 col-lg-4" key={g.key} delay={i * 100}>
              <h3 className="expertise-title">
                <Icon name={g.icon} /> {g.title}
              </h3>
              <Reveal as="ul" effect="flip-y" stagger={100} className="check-list">
                {g.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </Reveal>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
