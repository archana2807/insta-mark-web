import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { telHref } from "@/lib/format";

/** Google Maps search link for an address (no API key needed). */
const mapHref = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/**
 * Office columns on the Contact page (Crafto contact page: city, address, a hairline, E:, T:
 * and "View on Google Map"). Columns slide in one after another, as in the reference.
 * @param {{ offices: { title: string, address: string, email: string, phone: string }[] }} props
 * @returns {JSX.Element | null}
 */
export default function OfficeColumns({ offices }) {
  if (!offices?.length) return null;
  return (
    <section className="offices" aria-label="Our offices">
      <div className="container">
        <Reveal effect="left" stagger={300} className="row g-5">
          {offices.map((office) => (
            <div className="col-md-6 col-lg-4" key={office.title}>
              <div className="office">
                <h2 className="office__title">{office.title}</h2>
                <p className="office__address">{office.address}</p>
                <dl className="office__lines">
                  <div>
                    <dt>E:</dt>
                    <dd>
                      <a href={`mailto:${office.email}`}>{office.email}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>T:</dt>
                    <dd>
                      <a href={telHref(office.phone)}>{office.phone}</a>
                    </dd>
                  </div>
                </dl>
                <a
                  className="office__map"
                  href={mapHref(office.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="geo-alt" /> View on Google Map
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
