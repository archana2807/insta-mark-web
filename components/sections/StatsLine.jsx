import Reveal from "@/components/ui/Reveal";

/** Theme stats row: thin rule across the page with dot markers (one rule per row of 3). */
export default function StatsLine({ items, title }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  return (
    <section
      className="pb-7"
      aria-labelledby={title ? "why-title" : undefined}
      aria-label={title ? undefined : "Why choose Insta Mark"}
    >
      {title && (
        <div className="container">
          <h2 id="why-title" className="h3 mb-5">
            {title}
          </h2>
        </div>
      )}
      {rows.map((row, r) => (
        <div className={`stats-line${r > 0 ? " mt-6" : ""}`} key={r}>
          <div className="container">
            <div className="row g-4">
              {row.map((item, i) => (
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
      ))}
    </section>
  );
}
