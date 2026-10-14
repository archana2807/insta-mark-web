/**
 * Letters blur in one by one on page load (theme "fancy text" on the vertical
 * hero label). CSS only. The parent should be aria-hidden or the text should
 * be repeated for screen readers, since it is split into single letters.
 */
export default function FancyText({ text, className = "" }) {
  return (
    <span className={`fancy-text ${className}`.trim()}>
      {[...text].map((ch, i) => (
        <span key={i} style={{ "--i": i }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
