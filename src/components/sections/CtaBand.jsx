import BtnText from "@/components/ui/BtnText";
import ContactLink from "@/components/ui/ContactLink";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

/**
 * Call to action that sends the visitor to the Contact page form (the form itself lives
 * only on the Contact page). Title and text come from the client's content document.
 * @param {{ title: string, text: string, requirement?: string, label?: string }} props
 * @returns {JSX.Element}
 */
export default function CtaBand({ title, text, requirement, label = "Request a Consultation" }) {
  return (
    <section className="section cta-band" aria-labelledby="cta-band-title">
      <div className="container">
        <Reveal stagger={300} className="row align-items-end g-4 g-lg-5">
          <div className="col-lg-8">
            <h2 id="cta-band-title" className="cta-band__title">
              {title}
            </h2>
            <p className="mb-0">{text}</p>
          </div>
          <div className="col-lg-4 text-lg-end">
            <ContactLink requirement={requirement} className="btn btn-dark btn-lg">
              <BtnText>{label}</BtnText> <Icon name="arrow-right" />
            </ContactLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
