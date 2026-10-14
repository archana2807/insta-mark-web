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
 * Theme counter columns: label on top, big number at the bottom, vertical
 * rules between columns. Only real, verifiable figures belong here.
 */
export default function CounterColumns({ items }) {
  return (
    <section className="pb-7" aria-label="Insta Mark in numbers">
      <div className="container">
        <Reveal as="dl" stagger={200} className="row g-0 counter-cols mb-0">
          {items.map((item) => (
            <div className="col-6 col-lg-3" key={item.label}>
              <dt className="fw-medium">
                <p>{item.label}</p>
              </dt>
              <dd className="mb-0">
                <strong>
                  <Icon name="arrow-up" />
                  <RollingNumber value={item.value} />
                </strong>
              </dd>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
