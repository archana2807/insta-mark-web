import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

/** Each digit is a 0–9 strip that rolls to its value when scrolled into view. */
function RollingNumber({ value }) {
  const text = String(value);
  return (
    <>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {[...text].map((ch, i) =>
          /\d/.test(ch) ? (
            <span className="digit-roll" key={i}>
              <span className="digit-roll__strip" style={{ "--d": ch }}>
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
      </span>
    </>
  );
}

/**
 * The theme's counter columns on their own: label on top, big number at the bottom,
 * vertical rules between columns.
 * @param {{ items: { label: string, value: string | number }[], colClass?: string,
 *   arrow?: boolean }} props `colClass` sets the column width (Bootstrap classes);
 *   `arrow` shows the small up arrow before each number.
 * @returns {JSX.Element}
 */
export function CounterGrid({ items, colClass = "col-6 col-lg-3", arrow = true }) {
  return (
    <Reveal as="dl" stagger={200} className="row g-0 counter-cols mb-0">
      {items.map((item) => (
        <div className={colClass} key={item.label}>
          <dt className="fw-medium">
            <p>{item.label}</p>
          </dt>
          <dd className="mb-0">
            <strong>
              {arrow && <Icon name="arrow-up" />}
              <RollingNumber value={item.value} />
            </strong>
          </dd>
        </div>
      ))}
    </Reveal>
  );
}

/**
 * Theme counter columns as a page section. Only real, verifiable figures belong here
 * (sample numbers only where the developer asked for them, marked in content/site.js).
 * @param {{ items: { label: string, value: string | number }[], className?: string,
 *   colClass?: string }} props `className` sets the section spacing; `colClass` the
 *   column width (see CounterGrid).
 * @returns {JSX.Element}
 */
export default function CounterColumns({ items, className = "pb-7", colClass }) {
  return (
    <section className={className} aria-label="Insta Mark in numbers">
      <div className="container">
        <CounterGrid items={items} colClass={colClass} />
      </div>
    </section>
  );
}
