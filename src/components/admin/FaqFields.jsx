/** Fields for creating/editing an FAQ (server component). */
export default function FaqFields({ faq = {}, categories, idPrefix }) {
  const id = (n) => `${idPrefix}-${n}`;
  return (
    <div className="row g-2">
      <div className="col-lg-5">
        <label htmlFor={id("q")} className="form-label small fw-semibold">
          Question
        </label>
        <input
          id={id("q")}
          name="question"
          className="form-control form-control-sm"
          required
          maxLength={300}
          defaultValue={faq.question ?? ""}
        />
      </div>
      <div className="col-lg-3">
        <label htmlFor={id("cat")} className="form-label small fw-semibold">
          Shown on
        </label>
        <select
          id={id("cat")}
          name="categoryId"
          className="form-select form-select-sm"
          defaultValue={faq.categoryId ?? ""}
        >
          <option value="">Home + all solution pages (general)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} page only
            </option>
          ))}
        </select>
      </div>
      <div className="col-4 col-lg-1">
        <label htmlFor={id("order")} className="form-label small fw-semibold">
          Order
        </label>
        <input
          id={id("order")}
          name="sortOrder"
          type="number"
          min={0}
          className="form-control form-control-sm"
          defaultValue={faq.sortOrder ?? 0}
        />
      </div>
      <div className="col-8 col-lg-3 d-flex align-items-end gap-3">
        <div className="form-check">
          <input
            id={id("home")}
            name="showOnHome"
            type="checkbox"
            className="form-check-input"
            defaultChecked={faq.showOnHome ?? true}
          />
          <label htmlFor={id("home")} className="form-check-label small">
            Home page
          </label>
        </div>
        <div className="form-check">
          <input
            id={id("active")}
            name="isActive"
            type="checkbox"
            className="form-check-input"
            defaultChecked={faq.isActive ?? true}
          />
          <label htmlFor={id("active")} className="form-check-label small">
            Visible
          </label>
        </div>
      </div>
      <div className="col-12">
        <label htmlFor={id("a")} className="form-label small fw-semibold">
          Answer
        </label>
        <textarea
          id={id("a")}
          name="answer"
          rows={2}
          className="form-control form-control-sm"
          required
          maxLength={3000}
          defaultValue={faq.answer ?? ""}
        />
      </div>
    </div>
  );
}
