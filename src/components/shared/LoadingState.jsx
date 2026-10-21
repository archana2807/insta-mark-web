/**
 * "Loading…" card for admin sections.
 * @param {{ label?: string }} props
 */
export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="admin-card d-flex align-items-center gap-3" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span className="text-secondary">{label}</span>
    </div>
  );
}
