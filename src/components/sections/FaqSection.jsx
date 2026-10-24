"use client";

import Accordion from "react-bootstrap/Accordion";
import Reveal from "@/components/ui/Reveal";

/**
 * Theme services block: heading left, line accordion right. Emits FAQPage JSON-LD.
 * Motion as in the reference accordion: the heading rises in, then the questions rise in one
 * after another (30 px, 600 ms, 300 ms apart).
 */
export default function FaqSection({ faqs, title = "Frequently Asked Questions" }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-5">
            <Reveal as="h2" id="faq-title">
              {title}
            </Reveal>
          </div>
          <div className="col-lg-6 offset-lg-1">
            <Reveal as={Accordion} stagger={300} defaultActiveKey="0" className="faq-accordion">
              {faqs.map((f, i) => (
                <Accordion.Item eventKey={String(i)} key={f.question}>
                  <Accordion.Header as="h3">{f.question}</Accordion.Header>
                  <Accordion.Body>{f.answer}</Accordion.Body>
                </Accordion.Item>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
