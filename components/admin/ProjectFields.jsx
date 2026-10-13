/** Form fields shared by the create and edit project pages (server component). */
export default function ProjectFields({
  project = {},
  categories,
  industries,
  selectedCategoryIds = [],
}) {
  const v = (k, d = "") => project[k] ?? d;
  return (
    <>
      <div className="row g-3">
        <div className="col-md-8">
          <label htmlFor="title" className="form-label small fw-semibold">
            Project title *
          </label>
          <input
            id="title"
            name="title"
            className="form-control"
            required
            maxLength={150}
            defaultValue={v("title")}
            placeholder="e.g. CCI Residential Tower, Kandivali"
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="slug" className="form-label small fw-semibold">
            URL slug
          </label>
          <input
            id="slug"
            name="slug"
            className="form-control"
            maxLength={120}
            defaultValue={v("slug")}
            placeholder="auto from title"
          />
          <div className="form-text">/projects/&lt;slug&gt;</div>
        </div>
        <div className="col-md-4">
          <label htmlFor="clientName" className="form-label small fw-semibold">
            Client
          </label>
          <input
            id="clientName"
            name="clientName"
            className="form-control"
            maxLength={150}
            defaultValue={v("clientName")}
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="city" className="form-label small fw-semibold">
            City
          </label>
          <input
            id="city"
            name="city"
            className="form-control"
            maxLength={100}
            defaultValue={v("city")}
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="state" className="form-label small fw-semibold">
            State
          </label>
          <input
            id="state"
            name="state"
            className="form-control"
            maxLength={100}
            defaultValue={v("state")}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="year" className="form-label small fw-semibold">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            min={1990}
            max={2100}
            className="form-control"
            defaultValue={v("year")}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="industryId" className="form-label small fw-semibold">
            Industry
          </label>
          <select
            id="industryId"
            name="industryId"
            className="form-select"
            defaultValue={v("industryId")}
          >
            <option value="">—</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label htmlFor="sortOrder" className="form-label small fw-semibold">
            Order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            className="form-control"
            defaultValue={v("sortOrder", 0)}
          />
        </div>
        <div className="col-md-6 d-flex align-items-end gap-4">
          <div className="form-check">
            <input
              id="isFeatured"
              name="isFeatured"
              type="checkbox"
              className="form-check-input"
              defaultChecked={v("isFeatured", false)}
            />
            <label htmlFor="isFeatured" className="form-check-label">
              Featured
            </label>
          </div>
          <div className="form-check">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              className="form-check-input"
              defaultChecked={v("isActive", true)}
            />
            <label htmlFor="isActive" className="form-check-label">
              Visible on website
            </label>
          </div>
        </div>
      </div>

      <fieldset className="mt-3">
        <legend className="form-label small fw-semibold">Solutions used in this project</legend>
        <div className="row g-2">
          {categories.map((c) => (
            <div className="col-sm-6 col-lg-3" key={c.id}>
              <div className="form-check">
                <input
                  id={`cat-${c.id}`}
                  name="categoryIds"
                  value={c.id}
                  type="checkbox"
                  className="form-check-input"
                  defaultChecked={selectedCategoryIds.includes(c.id)}
                />
                <label htmlFor={`cat-${c.id}`} className="form-check-label">
                  {c.name}
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 mb-3">
        <label htmlFor="description" className="form-label small fw-semibold">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          className="form-control"
          defaultValue={v("description")}
        />
      </div>
    </>
  );
}
