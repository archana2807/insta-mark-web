import Reveal from "@/components/ui/Reveal";
import { RollingNumber } from "@/components/sections/CounterColumns";

/**
 * The row right under the home banner (client, 23 Oct 2026): the same section, spacing and
 * equal centred columns as the theme's logo row, with a counter in place of each logo. The
 * digits roll to their value and the items come in one by one as the row scrolls into view.
 * @param {{ items: { label: string, value: string | number }[] }} props
 * @returns {JSX.Element | null} nothing when there are no items
 */
export default function StatRow({ items }) {
  if (!items?.length) return null;
  return (
    <section className="project-logos" aria-label="Insta Mark at a glance">
      <div className="container">
        <Reveal as="ul" stagger={150} className="project-logos__list list-unstyled mb-0">
          {items.map((item) => (
            <li className="project-logos__stat" key={item.label}>
              <strong className="project-logos__value">
                <RollingNumber value={item.value} />
              </strong>
              <span className="project-logos__label">{item.label}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
