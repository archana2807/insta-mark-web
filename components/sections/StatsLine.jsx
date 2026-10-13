import Reveal from "@/components/ui/Reveal";

/** Theme stats row: thin rule across the page with dot markers. */
export default function StatsLine({ items }) {
  return (
    <section className="pb-7" aria-label="Why choose Insta Mark">
      <div className="stats-line">
        <div className="container">
          <div className="row g-4">
            {items.map((item, i) => (
              <Reveal className="col-md-4" key={item.title} delay={i * 100}>
                <div className="stats-line__item">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
