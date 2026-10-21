import { telHref, whatsappHref } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/** Floating WhatsApp / Call buttons. Hidden until the numbers are configured. */
export default function FloatingActions({ contact }) {
  if (!contact.whatsapp && !contact.phone) return null;

  return (
    <aside className="floating-actions" aria-label="Quick contact">
      {contact.whatsapp && (
        <a
          href={whatsappHref(
            contact.whatsapp,
            "Hello Insta Mark, I would like a quote for signage.",
          )}
          className="is-whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
        >
          <Icon name="whatsapp" />
        </a>
      )}
      {contact.phone && (
        <a href={telHref(contact.phone)} className="is-call" aria-label={`Call ${contact.phone}`}>
          <Icon name="telephone" />
        </a>
      )}
    </aside>
  );
}
