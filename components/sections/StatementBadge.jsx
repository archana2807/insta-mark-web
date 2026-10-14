import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";

/**
 * Theme "Brand experience / agency" block: a two-line statement with a static
 * circular text badge on the second line, and a short paragraph on the right.
 */
export default function StatementBadge({ line1, line2, badgeText, icon = "signpost", text }) {
  return (
    <section className="section statement">
      <div className="container">
        <h2 className="visually-hidden">
          {line1} {line2}
        </h2>
        <div className="row align-items-end g-4 g-lg-5">
          <Reveal stagger={250} className="col-lg-8">
            <p className="statement__title" aria-hidden="true">
              {line1}
            </p>
            <div className="statement__line2" aria-hidden="true">
              <svg className="statement__badge" viewBox="0 0 120 120" role="presentation">
                <defs>
                  <path id="badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
                  <linearGradient id="badge-gradient" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#b55f0b" />
                    <stop offset="1" stopColor="#177375" />
                  </linearGradient>
                </defs>
                <g className="statement__badge-ring">
                  <text fill="url(#badge-gradient)">
                    <textPath href="#badge-circle">{badgeText}</textPath>
                  </text>
                </g>
                <foreignObject x="44" y="44" width="32" height="32">
                  <div style={{ fontSize: 22, color: "#1d1d1d", lineHeight: 1 }}>
                    <Icon name={icon} />
                  </div>
                </foreignObject>
              </svg>
              <span className="statement__title">{line2}</span>
            </div>
          </Reveal>
          <Reveal className="col-lg-4">
            <p className="mb-0">{text}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
