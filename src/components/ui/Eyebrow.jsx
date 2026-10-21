export default function Eyebrow({ children, light = false, className = "" }) {
  return (
    <div className={`eyebrow ${light ? "eyebrow-light" : ""} ${className}`.trim()}>
      <span>{children}</span>
    </div>
  );
}
