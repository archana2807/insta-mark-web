/**
 * Big line of text that scrolls across the page (Crafto "Branding Agency" marquee).
 * Screen readers get the text once; the moving copies are hidden from them. With
 * prefers-reduced-motion the line stands still (see _sections.scss).
 * @param {{ text: string }} props
 * @returns {JSX.Element}
 */
export default function TextMarquee({ text }) {
  return (
    <section className="text-marquee" aria-label={text}>
      <p className="visually-hidden">{text}</p>
      <div className="text-marquee__track" aria-hidden="true">
        {[0, 1, 2, 3].map((copy) => (
          <span className="text-marquee__item" key={copy}>
            {text}
          </span>
        ))}
      </div>
    </section>
  );
}
