import Image from "next/image";
import EnquiryForm from "@/components/forms/EnquiryForm";
import Reveal from "@/components/ui/Reveal";
import { telHref, whatsappHref } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/**
 * Direct contact lines (call, WhatsApp, email); only what is set is shown.
 * @param {{ contact: object | null | undefined }} props
 * @returns {JSX.Element | null}
 */
function DirectContacts({ contact }) {
  const hasDirect = contact && (contact.phone || contact.email || contact.whatsapp);
  if (!hasDirect) return null;
  return (
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
            <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
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
  );
}

/**
 * Inline enquiry block (meeting: "contact form on the same page so they don't
 * need to go anywhere else"). With `photo` it follows the Crafto contact section: a photo
 * flush with the left edge (half the width) and, on the right, the title, the text and the
 * form with underlined fields.
 * @param {{ title: string, text: string, categories: { name: string }[],
 *   defaultRequirement?: string, categorySlug?: string, contact?: object, id?: string,
 *   photo?: { src: string, alt: string } | null }} props
 * @returns {JSX.Element}
 */
export default function EnquirySection({
  title,
  text,
  categories,
  defaultRequirement,
  categorySlug,
  contact,
  id = "enquiry",
  photo = null,
}) {
  const form = (variant) => (
    <EnquiryForm
      idPrefix={id}
      requirementOptions={categories.map((c) => c.name)}
      defaultRequirement={defaultRequirement}
      categorySlug={categorySlug}
      variant={variant}
    />
  );

  if (photo) {
    return (
      <section className="enquiry-photo" id={id} aria-labelledby={`${id}-title`}>
        <div className="row g-0">
          <div className="col-lg-6">
            <Reveal effect="wipe" className="enquiry-photo__media">
              <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 992px) 50vw, 100vw" />
            </Reveal>
          </div>
          <div className="col-lg-6 enquiry-photo__content">
            <Reveal className="enquiry-photo__inner">
              <h2 id={`${id}-title`} className="enquiry-photo__title">
                {title}
              </h2>
              {text && <p className="mb-0">{text}</p>}
              <DirectContacts contact={contact} />
            </Reveal>
            <div className="enquiry-photo__form">{form("line")}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section bg-surface" id={id} aria-labelledby={`${id}-title`}>
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-4">
            <h2 id={`${id}-title`} className="mb-4">
              {title}
            </h2>
            {text && <p>{text}</p>}
            <DirectContacts contact={contact} />
          </div>
          <div className="col-lg-8">
            <div className="enquiry-panel">{form("box")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
