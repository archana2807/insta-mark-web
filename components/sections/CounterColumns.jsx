import Icon from "@/components/ui/Icon";

/**
 * Theme counter columns: label on top, big number at the bottom, vertical
 * rules between columns. Only real, verifiable figures belong here.
 */
export default function CounterColumns({ items }) {
  return (
    <section className="pb-7" aria-label="Insta Mark in numbers">
      <div className="container">
        <dl className="row g-0 counter-cols mb-0">
          {items.map((item) => (
            <div className="col-6 col-lg-3" key={item.label}>
              <dt className="fw-medium">
                <p>{item.label}</p>
              </dt>
              <dd className="mb-0">
                <strong>
                  <Icon name="arrow-up" />
                  {item.value}
                </strong>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
