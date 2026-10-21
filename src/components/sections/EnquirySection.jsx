import Eyebrow from "@/components/ui/Eyebrow";
import EnquiryForm from "@/components/forms/EnquiryForm";
import { telHref, whatsappHref } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/**
 * Inline enquiry block (meeting: "contact form on the same page so they don't
 * need to go anywhere else").
 */
export default function EnquirySection({
  title,
  text,
  categories,
  defaultRequirement,
  categorySlug,
  contact,
  id = "enquiry",
}) {
  const hasDirect = contact && (contact.phone || contact.email || contact.whatsapp);

  return (
    <section className="section bg-surface" id={id} aria-labelledby={`${id}-title`}>
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-4">
            <Eyebrow>Request a quote</Eyebrow>
            <h2 id={`${id}-title`} className="mb-4">
              {title}
            </h2>
            <p>{text}</p>
            {hasDirect && (
              <ul className="contact-list mt-4">
                {contact.phone && (
                  <li>
                    <Icon name="telephone" />
                    <div>
                      <small>Call</small>
                      <a href={telHref(contact.phone)}>{contact.phone}</a>
                    </div>
                  </li>
                )}
                {contact.whatsapp && (
                  <li>
                    <Icon name="whatsapp" />
                    <div>
                      <small>WhatsApp</small>
                      <a
                        href={whatsappHref(contact.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Chat with us
                      </a>
                    </div>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <Icon name="envelope" />
                    <div>
                      <small>Email</small>
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="col-lg-8">
            <div className="enquiry-panel">
              <EnquiryForm
                idPrefix={id}
                requirementOptions={categories.map((c) => c.name)}
                defaultRequirement={defaultRequirement}
                categorySlug={categorySlug}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
