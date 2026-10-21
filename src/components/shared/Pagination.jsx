import Link from "next/link";

/**
 * Previous / "Page x of y" / Next for server-paginated admin lists. Hidden for one page.
 * @param {{ page: number, pages: number, href: (page: number) => string }} props
 */
export default function Pagination({ page, pages, href }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-3">
      <ul className="pagination pagination-sm">
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
          <Link className="page-link" href={href(page - 1)}>
            Previous
          </Link>
        </li>
        <li className="page-item disabled">
          <span className="page-link">
            Page {page} of {pages}
          </span>
        </li>
        <li className={`page-item ${page >= pages ? "disabled" : ""}`}>
          <Link className="page-link" href={href(page + 1)}>
            Next
          </Link>
        </li>
      </ul>
    </nav>
  );
}
