"use client";

import Accordion from "react-bootstrap/Accordion";
import Eyebrow from "@/components/ui/Eyebrow";

/** Theme services block: heading left, line accordion right. Emits FAQPage JSON-LD. */
export default function FaqSection({ faqs, title = "Frequently asked questions" }) {
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
        <div className="row g-5">
          <div className="col-lg-5">
            <Eyebrow>Basic information</Eyebrow>
            <h2 id="faq-title">{title}</h2>
          </div>
          <div className="col-lg-6 offset-lg-1">
            <Accordion defaultActiveKey="0" className="faq-accordion">
              {faqs.map((f, i) => (
                <Accordion.Item eventKey={String(i)} key={f.question}>
                  <Accordion.Header as="h3">{f.question}</Accordion.Header>
                  <Accordion.Body>{f.answer}</Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
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
