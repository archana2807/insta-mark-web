import SectionHeading from "@/components/ui/SectionHeading";

/** Theme "We work with brands…" block: heading left, title | text rows right. */
export default function RowList({ eyebrow, title, id, rows, className = "section" }) {
  return (
    <section className={className} aria-labelledby={id}>
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-5">
            <SectionHeading eyebrow={eyebrow} title={<span id={id}>{title}</span>} />
          </div>
          <div className="col-lg-7">
            <ul className="row-list">
              {rows.map((r) => (
                <li key={r.title}>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
